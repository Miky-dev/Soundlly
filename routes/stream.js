const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { get, run } = require('../db/sqlite');

// Helper per ottenere ID utente sicuro
const getUserId = (req) => req.user ? req.user.id : null;
const getUserRole = (req) => req.user ? req.user.role : null;
const getUserPlan = (req) => req.user ? req.user.plan : 'standard';

/**
 * GET /api/stream/track/:id
 * Endpoint unico per lo streaming sicuro di musica e suoni ambientali.
 */
router.get('/track/:id', async (req, res) => {
    try {
        const soundId = req.params.id;
        const userId = getUserId(req);
        const userRole = getUserRole(req);
        const userPlan = getUserPlan(req);

        // 1. Recupera metadati del suono dal DB
        const sound = await get(
            `SELECT * FROM sounds WHERE id = ?`,
            [soundId]
        );

        if (!sound) {
            return res.status(404).send('File non trovato');
        }

        // 2. Controllo Accesso (Privacy & Ruoli)



        // Caso B: Access Level "Premium" -> Solo Premium o Admin
        if (sound.access_level === 'premium') {
            const isPremium = userPlan === 'premium' || userPlan === 'admin' || userRole === 'admin';
            if (!isPremium) {
                return res.status(403).send('Accesso negato: riservato agli utenti Premium');
            }
        }

        // Caso C: Access Level "Registered" -> Solo Utenti Loggati
        if (sound.access_level === 'registered') {
            if (!userId) {
                return res.status(401).send('Accesso negato: effettuare il login');
            }
        }

        // Caso D: Access Level "Public" -> Tutti (nessun check)


        // 3. Determinazione Percorso File
        // Mappatura Category -> Directory in 'storage'
        let folder = 'ambient'; // default fallback

        if (sound.category === 'music') {
            folder = 'musiche';
        } else if (sound.category === 'sound') {
            // New user effects category -> 'suoni' folder
            folder = 'suoni';
        } else if (sound.category === 'ambient') {
            // System ambient sounds -> 'ambient' folder
            folder = 'ambient';
        }

        const filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);

        // 4. Streaming del File
        if (!fs.existsSync(filePath)) {
            console.error(`File fisico mancante: ${filePath}`);
            return res.status(404).send('File audio non trovato sul server');
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg', // O audio/mp3, audio/wav autodetection sarebbe meglio ma mp3 è standard qui
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }

    } catch (err) {
        console.error('Stream Error:', err);
        res.status(500).send('Errore interno del server');
    }
});



module.exports = router;
