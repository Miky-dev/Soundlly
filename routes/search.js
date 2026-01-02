const express = require('express');
const router = express.Router();
const { all } = require('../db/sqlite');

// GET /api/search?q=query
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        if (!query.trim()) {
            return res.json([]);
        }

        const searchTerm = `%${query}%`;
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE (s.title LIKE ? OR s.description LIKE ? OR u.username LIKE ?)
            AND s.access_level = 'public'
            ORDER BY s.created_at DESC
            LIMIT 20
        `;

        const results = await all(sql, [searchTerm, searchTerm, searchTerm]);
        res.json(results);
    } catch (err) {
        console.error('Search Error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
