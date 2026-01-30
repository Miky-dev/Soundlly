const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// Middleware: Ensure Premium or Admin
const ensurePremiumOrAdmin = (req, res, next) => {
    if (req.user && (req.user.plan === 'premium' || req.user.role === 'admin' || req.user.plan === 'admin')) {
        return next();
    }
    res.status(403).json({ error: 'Funzionalità riservata agli utenti Premium' });
};

// GET /api/playlist/candidates - Fetch music for selection
router.get('/candidates', ensureAuthenticated, ensurePremiumOrAdmin, async (req, res) => {
    try {
        // Fetch all sounds categorized as 'music'
        // Include 'is_liked' if needed, but for selection list usually just title/author is enough.
        // Also check access_level? Assuming user can add any public/registered music.
        const sounds = await all(`
            SELECT s.id, s.title, s.filename, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.category = 'music' AND s.access_level != 'private'
            ORDER BY s.title ASC
        `);
        res.json(sounds);
    } catch (err) {
        console.error("Playlist Candidates Error:", err);
        res.status(500).json({ error: 'Errore nel recupero dei brani' });
    }
});

// POST /api/playlist/create - Create new playlist
router.post('/create', ensureAuthenticated, ensurePremiumOrAdmin, async (req, res) => {
    try {
        const { name, description, tracks } = req.body; // tracks is array of sound_ids

        if (!name) return res.status(400).json({ error: 'Nome obbligatorio' });

        // 1. Create Playlist
        const { lastID } = await run(
            `INSERT INTO playlists (owner_id, name, description, visibility) VALUES (?, ?, ?, 'private')`,
            [req.user.id, name, description || '']
        );

        // 2. Add Tracks
        if (tracks && Array.isArray(tracks) && tracks.length > 0) {
            // Prepared statement for bulk insert not directly available in sqlite helper 'run', loop for now or construct query.
            // Looping is safer for SQL injection prevention with this helper.
            for (let i = 0; i < tracks.length; i++) {
                const soundId = tracks[i];
                await run(
                    `INSERT INTO playlist_items (playlist_id, sound_id, position) VALUES (?, ?, ?)`,
                    [lastID, soundId, i]
                );
            }
        }

        res.json({ ok: true, playlistId: lastID });

    } catch (err) {
        console.error("Create Playlist Error:", err);
        res.status(500).json({ error: 'Errore creazione playlist' });
    }
});

// GET /api/playlist/mine - Fetch current user's playlists
router.get('/mine', ensureAuthenticated, async (req, res) => {
    try {
        const playlists = await all(`
            SELECT 
                p.id, 
                p.name, 
                p.description,
                (SELECT s.icon 
                 FROM playlist_items pi
                 JOIN sounds s ON pi.sound_id = s.id
                 WHERE pi.playlist_id = p.id
                 ORDER BY pi.position ASC
                 LIMIT 1) as cover_image
            FROM playlists p
            WHERE p.owner_id = ?
            ORDER BY p.created_at DESC
        `, [req.user.id]);

        res.json(playlists);
    } catch (err) {
        console.error("Fetch My Playlists Error:", err);
        res.status(500).json({ error: 'Errore recupero playlist' });
    }
});

module.exports = router;
