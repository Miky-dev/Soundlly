const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { run, all, get } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * ROUTES/PROFILE.JS
 * 
 * Gestione del profilo utente pubblico e privato.
 * 
 * Funzionalità:
 * 1. Upload Avatar: Configurazione Multer per caricamento immagini profilo.
 * 2. CSRF Protection: Token di sicurezza per prevenire attacchi sui form.
 * 3. Visualizzazione: Rendering pagina profilo con dati utente e statistiche.
 * 4. Aggiornamento: Modifica dati anagrafici e preferenze.
 */

// --- CONFIGURAZIONE UPLOAD (Multer) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Cartella destinazione avatar
        cb(null, 'public/uploads/avatars/');
    },
    filename: function (req, file, cb) {
        // Generazione nome file univoco
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtri e limiti upload
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accetta solo immagini
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

// --- HELPER SICUREZZA CSRF ---

// Genera un token CSRF se non esiste nella sessione
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

// GET /profilo - Visualizza pagina profilo
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // Recupera dati freschi dal DB (per avere aggiornamenti immediati post-modifica)
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
        console.error("Errore Caricamento Profilo:", err);
        res.redirect('/home?error=profile_load');
    }
});

// POST /profilo/update - Aggiorna dati utente
// Gestisce sia campi testo che file upload ('avatar')
router.post('/update', ensureAuthenticated, upload.single('avatar'), async (req, res) => {
    // Controllo CSRF (Nota: Multer parsa il body prima di questo check, rendendo req.body disponibile)
    if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');

    try {
        const { display_name, bio, birth_place, location_city, location_country, date_of_birth, mood_theme } = req.body;
        let avatar_url = req.body.avatar_url; // Usa URL esistente se non cambia file

        if (req.file) {
            // Se c'è un nuovo file, aggiorna il percorso
            avatar_url = '/uploads/avatars/' + req.file.filename;
        }

        // update DB
        await run(
            `UPDATE users SET display_name=?, bio=?, avatar_url=?, birth_place=?, location_city=?, location_country=?, date_of_birth=?, mood_theme=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [display_name, bio, avatar_url, birth_place, location_city, location_country, date_of_birth, mood_theme, req.user.id]
        );
        res.redirect('/profilo?success=updated');
    } catch (err) {
        console.error("Errore Aggiornamento Profilo:", err);
        res.redirect('/profilo?error=update_failed&message=' + encodeURIComponent(err.message));
    }
});

module.exports = router;
