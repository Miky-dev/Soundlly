const express = require('express');
const router = express.Router();
const { all } = require('../db/sqlite');

/**
 * ROUTES/SEARCH.JS
 * 
 * Gestione API di ricerca globale nel sito.
 */

// GET /api/search?q=query
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        // Evita ricerche vuote
        if (!query.trim()) {
            return res.json([]);
        }

        // Preparazione pattern per ricerca SQL LIKE parziale
        const searchTerm = `%${query}%`;

        // Cerca suoni che corrispondono per Titolo, Descrizione o Nome Autore
        // Solo contenuti pubblici
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE (s.title LIKE ? OR s.description LIKE ? OR u.username LIKE ?)
            AND (s.access_level = 'public' OR s.access_level = 'premium')
            ORDER BY s.created_at DESC
            LIMIT 20
        `;

        const results = await all(sql, [searchTerm, searchTerm, searchTerm]);
        res.json(results);
    } catch (err) {
        console.error('Errore ricerca:', err);
        res.status(500).json({ error: 'Ricerca fallita' });
    }
});

module.exports = router;
