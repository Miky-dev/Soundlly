const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { run, all, get } = require('../db/sqlite');

// --- Multer Config ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine folder based on field name or type
        // For now, default to ambient, but we can check req.body (careful: body might be empty before file)
        // Let's us specific uploads directory
        const dir = path.join(__dirname, '..', 'public', 'audio', 'ambient');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Keep original name or safe name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sound-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// Secure all admin routes
router.use(ensureAuthenticated, ensureAdmin);

// --- Pages ---
router.get('/', async (req, res) => {
    try {
        const ambientSounds = await all(`SELECT * FROM sounds WHERE description = 'Suono Ambientale' OR icon IS NOT NULL`);
        const userSongs = await all(`SELECT * FROM sounds WHERE description != 'Suono Ambientale' AND icon IS NULL`); // Simple differentiation for now

        res.render('admin', {
            user: req.user,
            ambientSounds,
            userSongs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- API ---

// Create New Sound (Ambient)
router.post('/sounds', upload.single('audioFile'), async (req, res) => {
    try {
        const { title, icon, description } = req.body;
        const filename = req.file ? req.file.filename : null;

        if (!title || !filename) {
            return res.status(400).json({ error: 'Title and File required' });
        }

        await run(
            `INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, icon)
             VALUES (?, ?, ?, ?, 'audio', 'public', ?)`,
            [req.user.id, title, description || 'Suono Ambientale', filename, icon]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add sound' });
    }
});

// Update Sound
router.put('/sounds/:id', async (req, res) => {
    try {
        const { title, icon, description } = req.body;

        // Fetch current values to allow partial updates
        const current = await get(`SELECT * FROM sounds WHERE id = ?`, [req.params.id]);
        if (!current) return res.status(404).json({ error: 'Sound not found' });

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
        res.status(500).json({ error: 'Failed' });
    }
});

// Delete Sound
router.delete('/sounds/:id', async (req, res) => {
    try {
        // Optional: Delete file from disk
        const sound = await get(`SELECT filename FROM sounds WHERE id=?`, [req.params.id]);
        if (sound && sound.filename) {
            const filePath = path.join(__dirname, '..', 'public', 'audio', 'ambient', sound.filename);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.error('File delete error:', e); }
            }
        }
        await run(`DELETE FROM sounds WHERE id=?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
