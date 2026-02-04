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
 * Gestione dello streaming audio
 * Endpoint sicuro per la riproduzione di musica e suoni ambientali con supporto Range headers.
 */
router.get('/track/:id', async (req, res) => {
    try {
        const soundId = req.params.id;
        const userId = getUserId(req);
        const userRole = getUserRole(req);
        const userPlan = getUserPlan(req);

        // Recuperiamo i metadati del suono dal database
        const sound = await get(
            `SELECT * FROM sounds WHERE id = ?`,
            [soundId]
        );

        if (!sound) {
            return res.status(404).send('File non trovato');
        }

        // Controllo Accesso (Privacy & Ruoli)

        // Accesso riservato ai contenuti Premium (o Admin)
        if (sound.access_level === 'premium') {
            const isPremium = userPlan === 'premium' || userPlan === 'admin' || userRole === 'admin';
            if (!isPremium) {
                return res.status(403).send('Accesso negato: riservato agli utenti Premium');
            }
        }

        // Accesso riservato agli utenti registrati
        if (sound.access_level === 'registered') {
            if (!userId) {
                return res.status(401).send('Accesso negato: effettuare il login');
            }
        }

        // Accesso Pubblico: nessun controllo necessario (fallback)

        // Determinazione del percorso file in base alla categoria
        // Mappatura Category -> Directory in 'storage'
        let folder = 'ambient'; // default fallback

        if (sound.category === 'music') {
            folder = 'musiche';
        } else if (sound.category === 'sound') {
            // Categoria effetti sonori utente -> cartella 'suoni'
            folder = 'suoni';
        } else if (sound.category === 'ambient') {
            // Suoni ambientali di sistema -> cartella 'ambient'
            folder = 'ambient';
        }

        const filePath = path.join(__dirname, '..', 'storage', folder, sound.filename);

        // Streaming del file con supporto per il resume (Range requests)
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
