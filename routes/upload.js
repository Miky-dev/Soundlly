const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mm = require('music-metadata');
const fs = require('fs');

const { ensureAuthenticated } = require('../middleware/auth');
const { run } = require('../db/sqlite');

// --- Multer Config ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '..', 'public', 'temp_uploads');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Middleware to check for Creator or Admin role
const ensureCreatorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'creator' || req.user.role === 'admin')) {
        return next();
    }
    res.redirect('/abbonamento');
};

// GET /upload - Show the upload form
router.get('/', ensureAuthenticated, ensureCreatorOrAdmin, (req, res) => {
    res.render('upload', {
        user: req.user,
        canUpload: true,
        message: null,
        messageType: null
    });
});

// POST /api/upload - Handle the file upload
router.post('/api/upload', ensureAuthenticated, ensureCreatorOrAdmin, upload.single('audio'), async (req, res) => {
    const renderWithMsg = (msg, type = 'danger') => {
        res.render('upload', {
            user: req.user,
            canUpload: true,
            message: msg,
            messageType: type
        });
    };

    try {
        const { title, description, category, mood, genre, access_level, icon } = req.body;
        const file = req.file;

        if (!file) return renderWithMsg('Nessun file selezionato. Per favore scegli un file MP3.');
        if (!title) return renderWithMsg('Il titolo è obbligatorio.');

        const validCategories = ['ambient', 'music'];
        const selectedCategory = validCategories.includes(category) ? category : 'ambient';

        const targetDirName = selectedCategory === 'music' ? 'musiche' : 'ambient';
        const targetDir = path.join(__dirname, '..', 'public', 'audio', targetDirName);

        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const targetFilename = file.filename;
        const targetPath = path.join(targetDir, targetFilename);

        fs.renameSync(file.path, targetPath);

        // Extract Duration
        let duration = 0;
        try {
            const metadata = await mm.parseFile(targetPath);
            if (metadata && metadata.format && metadata.format.duration) {
                duration = Math.round(metadata.format.duration);
            }
        } catch (e) {
            console.error('Metadata extract error:', e);
        }

        await run(
            `INSERT INTO sounds (
                owner_id, title, description, filename, media_type, 
                access_level, category, mood, genre_primary, icon, duration_seconds
            ) VALUES (?, ?, ?, ?, 'audio', ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                description || '',
                targetFilename,
                access_level || 'public',
                selectedCategory,
                mood || null,
                genre || null,
                (selectedCategory === 'ambient' ? (icon || null) : null),
                duration
            ]
        );

        renderWithMsg('Caricamento completato con successo!', 'success');

    } catch (err) {
        console.error('Upload Error:', err);
        if (err.message && err.message.includes('no column named category')) {
            return renderWithMsg('Errore Database: Schema non aggiornato. Riprova più tardi.', 'danger');
        }
        renderWithMsg('Si è verificato un errore durante il caricamento.', 'danger');
    }
});

module.exports = router;
