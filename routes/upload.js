const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mm = require('music-metadata');
const fs = require('fs');

const { ensureAuthenticated } = require('../middleware/auth');
const { run } = require('../db/sqlite');

// --- Configurazione Multer (Upload File) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Cartella temporanea iniziale
        const tempDir = path.join(__dirname, '..', 'public', 'temp_uploads');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Usa il nome originale del file
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware: Controlla se l'utente è un Creator o Admin
const ensureCreatorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'creator' || req.user.role === 'admin')) {
        return next();
    }
    res.redirect('/abbonamento');
};

/**
 * GET /upload
 * Mostra il form di caricamento file.
 */
router.get('/', ensureAuthenticated, ensureCreatorOrAdmin, (req, res) => {
    res.render('upload', {
        user: req.user,
        canUpload: true,
        message: null,
        messageType: null
    });
});

/**
 * POST /api/upload
 * Gestisce l'upload effettivo del file audio e della copertina.
 * Sposta i file nelle cartelle definitive, estrae i metadati e salva nel DB.
 */
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

        // Categorie valide
        const validCategories = ['ambient', 'music'];
        const selectedCategory = validCategories.includes(category) ? category : 'ambient';

        // 1. Gestione File Audio
        // Determina cartella target in base alla categoria
        // Determines Category and Folder
        // User/Creator uploads: 
        // - Music -> category='music', folder='musiche'
        // - Ambient -> category='effect', folder='suoni' (Separation from System Ambient)

        let finalCategory = selectedCategory;
        let targetDirName = '';

        if (selectedCategory === 'music') {
            targetDirName = 'musiche';
        } else {
            // It was 'ambient' in the form
            // If user is Admin, they might want to upload real 'ambient', but this form is generic.
            // For now, let's assume 'upload.js' is the Creator/User interface.
            // Admins use 'admin.js' for system sounds.
            // So IF an admin uses this form, it's treated as a user upload (sound).
            finalCategory = 'sound';
            targetDirName = 'suoni';
        }
        // NEW: Secure Storage Path
        const targetDir = path.join(__dirname, '..', 'storage', targetDirName);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const targetFilename = audioFile.filename;
        const targetPath = path.join(targetDir, targetFilename);

        // Sposta file da temp a target
        fs.renameSync(audioFile.path, targetPath);

        // 2. Gestione Copertina (Universale per Musica e Suoni)
        let coverPath = null;
        if (coverFiles && coverFiles.length > 0) {
            const coverFile = coverFiles[0];
            const coversDir = path.join(__dirname, '..', 'public', 'uploads', 'covers');
            if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

            const coverFilename = coverFile.filename; // nome generato da multer
            const coverTarget = path.join(coversDir, coverFilename);
            fs.renameSync(coverFile.path, coverTarget);

            coverPath = '/uploads/covers/' + coverFilename;
        }

        // 3. Estrazione Metadati (Durata)
        let duration = 0;
        try {
            const metadata = await mm.parseFile(targetPath);
            if (metadata && metadata.format && metadata.format.duration) {
                duration = Math.round(metadata.format.duration);
            }
        } catch (e) {
            console.error('Errore estrazione metadati:', e);
        }

        // 4. Determina Icona/Cover
        // Priorità: Cover Caricata > Icona Manuale (solo ambient) > Default (fa-music)
        let finalIcon = null;

        if (coverPath) {
            finalIcon = coverPath;
        } else if (selectedCategory === 'ambient' && icon) {
            finalIcon = icon;
        } else {
            finalIcon = 'fa-music';
        }

        // 5. Salvataggio su DB
        console.log('Upload Debug:', { title, category: selectedCategory, coverFiles: coverFiles ? coverFiles.length : 0, coverPath, finalIcon });

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
                finalCategory,
                mood || null,
                genre || null,
                finalIcon,
                duration
            ]
        );

        renderWithMsg('Caricamento completato con successo!', 'success');

    } catch (err) {
        console.error('Upload Error:', err);
        renderWithMsg('Si è verificato un errore durante il caricamento.', 'danger');
    }
});

module.exports = router;
