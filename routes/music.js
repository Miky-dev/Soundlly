const express = require('express');
const router = express.Router();
const { all } = require('../db/sqlite');

// GET /api/music/latest
router.get('/latest', async (req, res) => {
    try {
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.category = 'music' AND s.access_level = 'public'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql);
        res.json(results);
    } catch (err) {
        console.error('Latest Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch music' });
    }
});

// GET /api/music/premium
router.get('/premium', async (req, res) => {
    try {
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.access_level = 'premium'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql);
        res.json(results);
    } catch (err) {
        console.error('Premium Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch premium music' });
    }
});

// GET /api/music/creators (Ambient sounds uploaded by users)
router.get('/creators', async (req, res) => {
    try {
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.category = 'ambient' AND s.access_level = 'public'
            ORDER BY s.created_at DESC
            LIMIT 10
        `;
        const results = await all(sql);
        res.json(results);
    } catch (err) {
        console.error('Creators Music Error:', err);
        res.status(500).json({ error: 'Failed to fetch creators music' });
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
