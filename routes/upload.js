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
router.post('/api/upload', ensureAuthenticated, ensureCreatorOrAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
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

        const audioFiles = req.files['audio'];
        const coverFiles = req.files['cover'];

        if (!audioFiles || audioFiles.length === 0) return renderWithMsg('Nessun file audio selezionato. Per favore scegli un file MP3.');
        const audioFile = audioFiles[0];

        if (!title) return renderWithMsg('Il titolo è obbligatorio.');

        const validCategories = ['ambient', 'music'];
        const selectedCategory = validCategories.includes(category) ? category : 'ambient';

        // 1. Handle Audio
        const targetDirName = selectedCategory === 'music' ? 'musiche' : 'ambient';
        const targetDir = path.join(__dirname, '..', 'public', 'audio', targetDirName);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const targetFilename = audioFile.filename;
        const targetPath = path.join(targetDir, targetFilename);
        fs.renameSync(audioFile.path, targetPath);

        // 2. Handle Cover (only for Music usually, but we save it if provided)
        let coverPath = null;
        if (selectedCategory === 'music' && coverFiles && coverFiles.length > 0) {
            const coverFile = coverFiles[0];
            const coversDir = path.join(__dirname, '..', 'public', 'uploads', 'covers');
            if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

            const coverFilename = coverFile.filename; // multer already generated unique name
            const coverTarget = path.join(coversDir, coverFilename);
            fs.renameSync(coverFile.path, coverTarget);

            coverPath = '/uploads/covers/' + coverFilename;
        }

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

        // Determine "icon" field value:
        // - Ambient: use the font-awesome icon string (e.g. "fa-cloud")
        // - Music: use the cover image path (e.g. "/uploads/covers/...")
        let finalIcon = null;
        if (selectedCategory === 'ambient') {
            finalIcon = icon || null;
        } else {
            finalIcon = coverPath || '/immagini/usericon.png'; // Fallback
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
                finalIcon,
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
