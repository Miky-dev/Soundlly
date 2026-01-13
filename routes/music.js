const express = require('express');
const router = express.Router();
const { all, run, get } = require('../db/sqlite');

// Helper to get user ID specific queries
const getUserId = (req) => req.user ? req.user.id : null;

const MUSIC_QUERY = `
    SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author,
    CASE WHEN sl.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
    FROM sounds s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN sound_likes sl ON s.id = sl.sound_id AND sl.user_id = ?
`;

// GET /api/music/latest
router.get('/latest', async (req, res) => {
    try {
        const userId = getUserId(req);
        const sql = `
            ${MUSIC_QUERY}
            WHERE s.category = 'music' AND s.access_level = 'public'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Latest Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch music' });
    }
});

// GET /api/music/premium
router.get('/premium', async (req, res) => {
    try {
        const userId = getUserId(req);
        const sql = `
            ${MUSIC_QUERY}
            WHERE s.access_level = 'premium'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Premium Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch premium music' });
    }
});

// GET /api/music/creators (Ambient sounds uploaded by users)
router.get('/creators', async (req, res) => {
    try {
        const userId = getUserId(req);
        const sql = `
            ${MUSIC_QUERY}
            WHERE s.category = 'ambient' AND s.access_level = 'public'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Creators Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch creators music' });
    }
});



// POST /api/music/favorites/:id/toggle
router.post('/favorites/:id/toggle', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Devi essere loggato' });
    }

    const userId = req.user.id;
    const soundId = req.params.id;

    try {
        // Check if exists
        const existing = await get('SELECT 1 FROM sound_likes WHERE user_id = ? AND sound_id = ?', [userId, soundId]);

        if (existing) {
            // Remove
            await run('DELETE FROM sound_likes WHERE user_id = ? AND sound_id = ?', [userId, soundId]);
            res.json({ success: true, liked: false });
        } else {
            // Add
            await run('INSERT INTO sound_likes (user_id, sound_id) VALUES (?, ?)', [userId, soundId]);
            res.json({ success: true, liked: true });
        }
    } catch (err) {
        console.error('Favorites Toggle Error:', err);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

// GET /api/music/favorites
router.get('/favorites', async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.json([]);

        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            JOIN sound_likes sl ON s.id = sl.sound_id
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE sl.user_id = ?
            ORDER BY sl.created_at DESC
            LIMIT 20
        `;
        const results = await all(sql, [req.user.id]);
        res.json(results);
    } catch (err) {
        console.error('Favorites Error:', err);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

module.exports = router;
