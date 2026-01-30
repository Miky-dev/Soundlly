// ROUTES/ADMIN.JS

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { run, all, get } = require('../db/sqlite');

/**
 * ROUTES/ADMIN.JS
 * Gestione pannello di amministrazione.
 */

// --- Configurazione Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'storage', 'ambient');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Usa il nome originale del file
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// MIDDLEWARE
router.use(ensureAuthenticated, ensureAdmin);

// --- ROTTE PAGINE ---

// GET /admin
router.get('/', async (req, res) => {
    try {
        // 1. Suoni di Sistema (Admin)
        // Usa LEFT JOIN per includere anche suoni senza owner (legacy) considerandoli di sistema
        const systemSounds = await all(`
            SELECT s.*, u.username as owner_name 
            FROM sounds s 
            LEFT JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient' AND (u.role = 'admin' OR s.owner_id IS NULL)
        `);

        // 2. Suoni Utenti (Non Admin)
        const userAmbientSounds = await all(`
            SELECT s.*, u.username as owner_name 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient' AND u.role != 'admin'
        `);

        // 3. Canzoni Utenti
        const userSongs = await all(`
            SELECT s.*, u.username as owner_name 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'music'
        `);

        res.render('admin', {
            user: req.user,
            systemSounds,
            userAmbientSounds,
            userSongs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore Server');
    }
});

// --- API ---

// POST /admin/sounds - Nuovo Suono
router.post('/sounds', upload.single('audioFile'), async (req, res) => {
    try {
        const { title, icon, description } = req.body;
        const filename = req.file ? req.file.filename : null;

        if (!title || !filename) {
            return res.status(400).json({ error: 'Titolo e File obbligatori' });
        }

        await run(
            `INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, icon, category)
             VALUES (?, ?, ?, ?, 'audio', 'public', ?, 'ambient')`,
            [req.user.id, title, description || 'Suono Ambientale', filename, icon]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore inserimento' });
    }
});

// PUT /admin/sounds/:id - Modifica
router.put('/sounds/:id', async (req, res) => {
    try {
        const { title, icon, description } = req.body;
        const current = await get(`SELECT * FROM sounds WHERE id = ?`, [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Suono non trovato' });

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
        res.status(500).json({ error: 'Errore update' });
    }
});

// DELETE /admin/sounds/:id - Singolo
router.delete('/sounds/:id', async (req, res) => {
    try {
        const sound = await get(`SELECT filename, category FROM sounds WHERE id=?`, [req.params.id]);
        if (sound && sound.filename) {
            let folder = (sound.category === 'music') ? 'musiche' : 'ambient';
            let filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);

            console.log(`[DELETE DEBUG] ID: ${req.params.id} | Initial Path: ${filePath} | Exists: ${fs.existsSync(filePath)}`);

            if (sound.category === 'ambient' && !fs.existsSync(filePath)) {
                folder = 'suoni';
                filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);
                console.log(`[DELETE DEBUG] Switch to SUONI path: ${filePath} | Exists: ${fs.existsSync(filePath)}`);
            }

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`[DELETE DEBUG] File deleted successfully: ${filePath}`);
                } catch (e) { console.error('[DELETE DEBUG] Error unlink:', e); }
            } else {
                console.log(`[DELETE DEBUG] File NOT FOUND on disk, skipping delete.`);
            }
        }
        await run(`DELETE FROM sounds WHERE id=?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore delete' });
    }
});

// POST /admin/api/bulk-delete - Multiplo
router.post('/api/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs' });

        const placeholders = ids.map(() => '?').join(',');
        const sounds = await all(`SELECT id, filename, category FROM sounds WHERE id IN (${placeholders})`, ids);

        for (const sound of sounds) {
            if (sound.filename) {
                let folder = (sound.category === 'music') ? 'musiche' : 'ambient';
                let filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);

                console.log(`[BULK DELETE] ID: ${sound.id} | Initial: ${filePath} | Exists: ${fs.existsSync(filePath)}`);

                if (sound.category === 'ambient' && !fs.existsSync(filePath)) {
                    folder = 'suoni';
                    filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);
                    console.log(`[BULK DELETE] Switch to SUONI: ${filePath} | Exists: ${fs.existsSync(filePath)}`);
                }

                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`[BULK DELETE] Deleted: ${filePath}`);
                    } catch (e) { console.error('[BULK DELETE] Error:', e); }
                } else {
                    console.log(`[BULK DELETE] File not found: ${filePath}`);
                }
            }
        }

        await run(`DELETE FROM sounds WHERE id IN (${placeholders})`, ids);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore bulk delete' });
    }
});

module.exports = router;
