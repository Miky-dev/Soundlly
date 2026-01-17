const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { run, all, get } = require('../db/sqlite');

/**
 * ROUTES/ADMIN.JS
 * 
 * Questo file gestisce le funzionalità del pannello di amministrazione.
 * Accessibile solo agli utenti con ruolo 'admin'.
 * 
 * Funzionalità principali:
 * 1. Upload di file audio (suoni ambientali).
 * 2. Visualizzazione liste suoni e musiche utenti.
 * 3. Operazioni CRUD (Create, Read, Update, Delete) sui suoni.
 */

// --- Configurazione Multer (Gestione Upload File) ---
// Definiamo dove salvare i file audio caricati dagli admin
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Percorso di destinazione: public/audio/ambient
        const dir = path.join(__dirname, '..', 'public', 'audio', 'ambient');
        // Crea la cartella se non esiste
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Genera un nome file univoco per evitare sovrascritture
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sound-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// MIDDLEWARE DI SICUREZZA
// Tutte le rotte in questo file richiedono che l'utente sia loggato E sia admin.
router.use(ensureAuthenticated, ensureAdmin);

// --- ROTTE PAGINE (Visualizzazione) ---

// GET /admin - Dashboard Amministratore
router.get('/', async (req, res) => {
    try {
        // Recupera tutti i suoni ambientali
        const ambientSounds = await all(`
            SELECT s.*, u.username as owner_name 
            FROM sounds s 
            LEFT JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient'
        `);
        // Recupera tutte le canzoni caricate dagli utenti
        const userSongs = await all(`
            SELECT s.*, u.username as owner_name 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'music'
        `);

        // Renderizza la vista 'admin.ejs' passando i dati
        res.render('admin', {
            user: req.user,
            ambientSounds,
            userSongs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore Server');
    }
});

// --- API (Operazioni Dati) ---

// POST /admin/sounds - Caricamento Nuovo Suono Ambientale
router.post('/sounds', upload.single('audioFile'), async (req, res) => {
    try {
        const { title, icon, description } = req.body;
        const filename = req.file ? req.file.filename : null;

        // Validazione minima
        if (!title || !filename) {
            return res.status(400).json({ error: 'Titolo e File sono obbligatori' });
        }

        // Inserimento nel database
        await run(
            `INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, icon)
             VALUES (?, ?, ?, ?, 'audio', 'public', ?)`,
            [req.user.id, title, description || 'Suono Ambientale', filename, icon]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Impossibile aggiungere il suono' });
    }
});

// PUT /admin/sounds/:id - Modifica Suono Esistente
router.put('/sounds/:id', async (req, res) => {
    try {
        const { title, icon, description } = req.body;

        // Recupera i dati attuali per permettere modifiche parziali
        const current = await get(`SELECT * FROM sounds WHERE id = ?`, [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Suono non trovato' });

        // Usa il nuovo valore se presente, altrimenti mantieni il vecchio
        const newTitle = title !== undefined ? title : current.title;
        const newIcon = icon !== undefined ? icon : current.icon;
        const newDesc = description !== undefined ? description : current.description;

        await run(
            `UPDATE sounds SET title=?, icon=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [newTitle, newIcon, newDesc, req.params.id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Operazione fallita' });
    }
});

// DELETE /admin/sounds/:id - Eliminazione Suono
router.delete('/sounds/:id', async (req, res) => {
    try {
        // Recupera il nome del file per poterlo cancellare anche dal disco
        const sound = await get(`SELECT filename FROM sounds WHERE id=?`, [req.params.id]);
        if (sound && sound.filename) {
            const filePath = path.join(__dirname, '..', 'public', 'audio', 'ambient', sound.filename);
            // Verifica esistenza e cancella file fisico
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.error('Errore eliminazione file:', e); }
            }
        }
        // Cancella record dal database
        await run(`DELETE FROM sounds WHERE id=?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Eliminazione fallita' });
    }
});

module.exports = router;
