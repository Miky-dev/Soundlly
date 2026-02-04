const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { run, all, get } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * Gestione del profilo utente
 * Gestisce la visualizzazione, la modifica dei dati personali e l'upload dell'avatar.
 * Include anche la sicurezza CSRF per i form sensibili.
 */

// Configurazione di Multer per la gestione degli upload (avatar)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // I file vengono salvati nella cartella pubblica dedicata
        cb(null, 'public/uploads/avatars/');
    },
    filename: function (req, file, cb) {
        // Generazione nome file univoco
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configura i filtri (solo immagini) e i limiti di dimensione (5MB)
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accettiamo solo formati immagine standard
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo immagini (jpeg, jpg, png) sono permesse!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limite 5MB
});

// Gestione della sicurezza CSRF (Cross-Site Request Forgery)

// Genera o recupera il token CSRF dalla sessione
function ensureCsrfToken(req) {
    if (!req.session) return null;
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    return req.session.csrfToken;
}

// Verifica che il token inviato corrisponda a quello in sessione
function checkCsrf(req, res) {
    const bodyToken = req.body && req.body._csrf;
    const queryToken = req.query && req.query._csrf;
    const headerToken = req.headers['x-csrf-token'];
    const token = bodyToken || queryToken || headerToken;

    if (!token || !req.session.csrfToken || token !== req.session.csrfToken) {
        return false;
    }
    return true;
}

// --- ROTTE ---

// Visualizza la pagina del profilo personale
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // Recuperiamo i dati utente freschi dal DB per riflettere eventuali modifiche recenti
        const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.redirect('/logout');
        }

        // Recupera eventuali contenuti caricati dall'utente
        const userSounds = await all('SELECT * FROM sounds WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);

        res.render('profilo', {
            user: user,
            sounds: userSounds,
            csrfToken: ensureCsrfToken(req), // Invia token per il form
            error: req.query.error,
            success: req.query.success
        });
    } catch (err) {
        console.error("Errore nel caricamento del profilo:", err);
        res.redirect('/home?error=profile_load');
    }
});

// Aggiorna le informazioni del profilo e l'avatar
router.post('/update', ensureAuthenticated, upload.single('avatar'), async (req, res) => {
    // Verifica CSRF (il body è disponibile grazie a multer che lo ha già parsato)
    if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');

    try {
        const { display_name, bio, born_city, location_country, date_of_birth } = req.body;
        let avatar_url = req.body.avatar_url; // Mantiene l'avatar corrente se non ne viene caricato uno nuovo

        if (req.file) {
            // Aggiorna il percorso se è stato caricato un nuovo file
            avatar_url = '/uploads/avatars/' + req.file.filename;
        }

        // Eseguiamo l'update nel database mapping i campi corrispettivi
        await run(
            `UPDATE users SET display_name=?, bio=?, avatar_url=?, born_city=?, location_country=?, date_of_birth=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [display_name, bio, avatar_url, born_city, location_country, date_of_birth, req.user.id]
        );
        res.redirect('/profilo?success=updated');
    } catch (err) {
        console.error("Errore durante l'aggiornamento del profilo:", err);
        res.redirect('/profilo?error=update_failed&message=' + encodeURIComponent(err.message));
    }
});

module.exports = router;
