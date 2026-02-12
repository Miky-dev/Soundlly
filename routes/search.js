const express = require('express');
const router = express.Router();
const { all } = require('../db/sqlite');

/**
 * Gestione delle ricerche
 * API per la ricerca globale di brani, suoni ambientali e creators all'interno della piattaforma.
 */

// Esegue una ricerca testuale (titolo, descrizione, autore, ecc.)
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        // Se la query è vuota, restituiamo un array vuoto per evitare carico inutile
        if (!query.trim()) {
            return res.json([]);
        }

        // Prepariamo il pattern per la ricerca parziale (wildcard)
        const searchTerm = `%${query}%`;
        const userId = req.user ? req.user.id : null;

        // Eseguiamo la query cercando corrispondenze in titolo, descrizione, mood o nome autore
        // Mostriamo contenuti pubblici o premium (se l'utente ha accesso)
        // Aggiungiamo 'registered' se l'utente è loggato
        const sql = `
            SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE (s.title LIKE ? OR s.description LIKE ? OR u.username LIKE ? OR s.mood LIKE ? OR s.genre_primary LIKE ?)
            AND (s.access_level = 'public' OR s.access_level = 'premium' OR (s.access_level = 'registered' AND ? IS NOT NULL))
            ORDER BY s.created_at DESC
            LIMIT 20
        `;

        const results = await all(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, userId]);
        res.json(results);
    } catch (err) {
        console.error('Errore durante la ricerca:', err);
        res.status(500).json({ error: 'Si è verificato un errore durante la ricerca' });
    }
});

module.exports = router;
