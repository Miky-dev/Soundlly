const express = require('express');
const router = express.Router();
const { all, run, get } = require('../db/sqlite');

/**
 * ROUTES/MUSIC.JS
 * 
 * Gestione delle tracce musicali.
 * Fornisce API per recuperare diverse categorie di musica e gestire i "Mi piace".
 */

// Helper per ottenere ID utente sicuro (null se non loggato)
const getUserId = (req) => req.user ? req.user.id : null;

// Query Base:
// Seleziona i dettagli della canzone e aggiunge un flag 'is_liked' se l'utente corrente ha messo like.
const MUSIC_QUERY = `
    SELECT s.id, s.title, s.description, s.filename, s.icon, s.category, u.username as author, s.owner_id, u.role as owner_role,
    CASE WHEN sl.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
    FROM sounds s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN sound_likes sl ON s.id = sl.sound_id AND sl.user_id = ?
    `;

// GET /api/music/latest - Ultime uscite musicali (Pubbliche)
router.get('/latest', async (req, res) => {
    try {
        const userId = getUserId(req);
        const sql = `
            ${MUSIC_QUERY}
            WHERE (s.category = 'music' OR s.category = 'sound') AND (s.access_level = 'public' OR (s.access_level = 'registered' AND ? IS NOT NULL))
            ORDER BY s.created_at DESC
            LIMIT 10
    `;
        const results = await all(sql, [userId, userId]);
        res.json(results);
    } catch (err) {
        console.error('Errore Latest Music:', err);
        res.status(500).json({ error: 'Recupero musica fallito' });
    }
});

// GET /api/music/premium - Musica Riservata (Premium)
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
        console.error('Errore Premium Music:', err);
        res.status(500).json({ error: 'Recupero musica premium fallito' });
    }
});

// GET /api/music/creators - Suoni Ambientali creati dagli utenti (Community)
router.get('/creators', async (req, res) => {
    try {
        const userId = getUserId(req);
        const sql = `
            ${MUSIC_QUERY}
            WHERE s.category = 'sound' AND (s.access_level = 'public' OR (s.access_level = 'registered' AND ? IS NOT NULL))
            ORDER BY s.created_at DESC
            LIMIT 10
    `;
        const results = await all(sql, [userId, userId]);
        res.json(results);
    } catch (err) {
        console.error('Errore Creators Music:', err);
        res.status(500).json({ error: 'Recupero musica creators fallito' });
    }
});


// --- GESTIONE PREFERITI (LIKES) ---

// POST /api/music/favorites/:id/toggle - Aggiunge/Rimuove dai preferiti
router.post('/favorites/:id/toggle', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Devi essere loggato' });
    }

    const userId = req.user.id;
    const soundId = parseInt(req.params.id, 10); // Check type safety

    if (isNaN(soundId)) {
        return res.status(400).json({ error: 'ID non valido' });
    }

    try {
        // Controlla se il like esiste già
        const existing = await get('SELECT 1 FROM sound_likes WHERE user_id = ? AND sound_id = ?', [userId, soundId]);

        if (existing) {
            // Se esiste, rimuovi (Unlike)
            await run('DELETE FROM sound_likes WHERE user_id = ? AND sound_id = ?', [userId, soundId]);
            res.json({ success: true, liked: false });
        } else {
            // Se non esiste, aggiungi (Like)
            await run('INSERT INTO sound_likes (user_id, sound_id) VALUES (?, ?)', [userId, soundId]);
            res.json({ success: true, liked: true });
        }
    } catch (err) {
        console.error('Errore Toggle Favorite:', err);
        // Expose detailed error for easier debugging
        res.status(500).json({ error: 'Operazione fallita', details: err.message });
    }
});

// GET /api/music/favorites - Lista dei brani preferiti dall'utente
router.get('/favorites', async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.json([]);

        // Join con la tabella sound_likes per ottenere solo i brani "piaciuti"
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
        console.error('Errore Favorites:', err);
        res.status(500).json({ error: 'Recupero preferiti fallito' });
    }
});

module.exports = router;
