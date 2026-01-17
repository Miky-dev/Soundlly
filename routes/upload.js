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
        // User/Creator uploads: Music -> musiche, Ambient -> suoni
        const targetDirName = selectedCategory === 'music' ? 'musiche' : 'suoni';
        const targetDir = path.join(__dirname, '..', 'public', 'audio', targetDirName);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const targetFilename = audioFile.filename;
        const targetPath = path.join(targetDir, targetFilename);

        // Sposta file da temp a target
        fs.renameSync(audioFile.path, targetPath);

        // 2. Gestione Copertina (Opzionale per Ambient, necessaria o default per Music)
        let coverPath = null;
        if (selectedCategory === 'music') {
            if (coverFiles && coverFiles.length > 0) {
                const coverFile = coverFiles[0];
                const coversDir = path.join(__dirname, '..', 'public', 'uploads', 'covers');
                if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

                const coverFilename = coverFile.filename; // nome generato da multer
                const coverTarget = path.join(coversDir, coverFilename);
                fs.renameSync(coverFile.path, coverTarget);

                coverPath = '/uploads/covers/' + coverFilename;
            } else {
                // Copertina di default
                coverPath = '/immagini/copertinaDef.png';
            }
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

        // 4. Determina Icona
        // - Ambient: classe FontAwesome (es. "fa-cloud")
        // - Music: path immagine copertina
        let finalIcon = null;
        if (selectedCategory === 'ambient') {
            finalIcon = icon || null;
        } else {
            finalIcon = coverPath || '/immagini/usericon.png';
        }

        // 5. Salvataggio su DB
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
        renderWithMsg('Si è verificato un errore durante il caricamento.', 'danger');
    }
});

module.exports = router;
