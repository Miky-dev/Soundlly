const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { run, all } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// CSRF Helper for this module
function ensureCsrfToken(req) {
    if (!req.session) return null;
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    return req.session.csrfToken;
}

function checkCsrf(req, res) {
    const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
    if (!token || !req.session.csrfToken || token !== req.session.csrfToken) {
        return false;
    }
    return true;
}

// GET /profilo
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userSounds = await all('SELECT * FROM sounds WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.render('profilo', {
            user: req.user,
            sounds: userSounds,
            csrfToken: ensureCsrfToken(req),
            error: req.query.error
        });
    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect('/home?error=profile_load');
    }
});

// POST /profilo/update
router.post('/update', ensureAuthenticated, async (req, res) => {
    // CSRF check
    if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');

    try {
        const { display_name, bio, avatar_url, birth_place, location_city } = req.body;
        await run(
            `UPDATE users SET display_name=?, bio=?, avatar_url=?, birth_place=?, location_city=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [display_name, bio, avatar_url, birth_place, location_city, req.user.id]
        );
        res.redirect('/profilo?success=updated');
    } catch (err) {
        console.error(err);
        res.redirect('/profilo?error=update_failed');
    }
});

module.exports = router;
