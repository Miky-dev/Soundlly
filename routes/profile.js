const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { run, all, get } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatars/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo immagini (jpeg, jpg, png) sono permesse!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// CSRF Helper for this module
function ensureCsrfToken(req) {
    if (!req.session) return null;
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    return req.session.csrfToken;
}

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

// GET /profilo
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch fresh user data to ensure we have the latest fields (mood, etc.)
        const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

        // Fallback if user is somehow not found
        if (!user) {
            return res.redirect('/logout');
        }

        const userSounds = await all('SELECT * FROM sounds WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);

        res.render('profilo', {
            user: user, // Use freshly fetched user
            sounds: userSounds,
            csrfToken: ensureCsrfToken(req),
            error: req.query.error,
            success: req.query.success
        });
    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect('/home?error=profile_load');
    }
});

// POST /profilo/update
router.post('/update', ensureAuthenticated, upload.single('avatar'), async (req, res) => {
    // CSRF check (Multipart forms might need body parsing before CSRF check if the token is in the body)
    // Multer handles body parsing, so req.body should be populated after upload.single
    if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');

    try {
        const { display_name, bio, birth_place, location_city, location_country, date_of_birth, mood_theme } = req.body;
        let avatar_url = req.body.avatar_url; // Fallback to URL if provided and no file

        if (req.file) {
            // If a file was uploaded, use its path
            avatar_url = '/uploads/avatars/' + req.file.filename;
        }

        await run(
            `UPDATE users SET display_name=?, bio=?, avatar_url=?, birth_place=?, location_city=?, location_country=?, date_of_birth=?, mood_theme=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [display_name, bio, avatar_url, birth_place, location_city, location_country, date_of_birth, mood_theme, req.user.id]
        );
        res.redirect('/profilo?success=updated');
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.redirect('/profilo?error=update_failed&message=' + encodeURIComponent(err.message));
    }
});

module.exports = router;
