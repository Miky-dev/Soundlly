const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * Gestione della sezione "Focus"
 * Include le API per il Timer (Pomodoro) e i Suoni Ambientali.
 * 
 * Funzionalità principali:
 * - Salvataggio preferenze timer (durata sessioni e pause).
 * - Tracciamento delle sessioni di studio per le statistiche.
 * - Gestione dei suoni ambientali (volume, attivazione e statistiche).
 */

// --- GESTIONE IMPOSTAZIONI TIMER ---

// Restituisce la configurazione del timer (default o personalizzata)
router.get('/settings', async (req, res) => {
    try {
        // Valori di default
        const MODES = {
            pomodoro: { minutes: 25 },
            shortBreak: { minutes: 5 }
        };

        if (!req.isAuthenticated()) {
            return res.json({
                pomodoro: MODES.pomodoro.minutes,
                shortBreak: MODES.shortBreak.minutes
            });
        }

        // Recupera le impostazioni salvate dell'utente
        const userId = req.user.id;
        const row = await get(`SELECT focus_minutes, short_break_minutes FROM users WHERE id=?`, [userId]);

        res.json({
            pomodoro: row?.focus_minutes || MODES.pomodoro.minutes,
            shortBreak: row?.short_break_minutes || MODES.shortBreak.minutes
        });
    } catch (err) {
        console.error('Errore nel recupero delle impostazioni focus:', err);
        res.status(500).json({ error: 'failed' });
    }
});

// POST /api/focus/settings - Salva configurazione timer
router.post('/settings', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pomodoro, shortBreak } = req.body;

        await run(
            `UPDATE users 
             SET focus_minutes=?, short_break_minutes=?
             WHERE id=?`,
            [pomodoro || 25, shortBreak || 5, userId]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Errore salvataggio settings', err);
        res.status(500).json({ error: 'failed' });
    }
});

// --- GESTIONE SESSIONI (TRACKING) ---

// Avvia una nuova sessione di focus
router.post('/start', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { session_type = 'pomodoro', planned_minutes = 25 } = req.body || {};

        // Creiamo una nuova sessione con stato 'in_progress'
        const result = await run(
            `INSERT INTO focus_sessions (user_id, session_type, planned_minutes, status)
             VALUES (?, ?, ?, 'in_progress')`,
            [userId, session_type, Math.max(1, +planned_minutes || 25)]
        );

        return res.json({ ok: true, session_id: result.lastID });
    } catch (err) {
        console.error('Errore avvio sessione:', err);
        res.status(500).json({ error: 'focus_start_failed' });
    }
});

// Termina una sessione (completata o interrotta)
router.post('/stop', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { session_id, completed_minutes = 0, status = 'completed' } = req.body || {};

        if (!session_id) return res.status(400).json({ error: 'session_id_required' });

        // Verifica proprietà della sessione
        const row = await get(`SELECT id FROM focus_sessions WHERE id=? AND user_id=?`, [session_id, userId]);
        if (!row) {
            return res.status(404).json({ error: 'session_not_found' });
        }

        // Determina lo stato finale
        const validStatuses = ['in_progress', 'completed', 'interrupted', 'abandoned'];
        const finalStatus = validStatuses.includes(status) ? status : 'completed';

        await run(
            `UPDATE focus_sessions
             SET completed_minutes=?, status=?, ended_at=CURRENT_TIMESTAMP
             WHERE id=?`,
            [completed_minutes, finalStatus, session_id]
        );

        // Calcola statistiche giornaliere aggiornate
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().replace('T', ' ').split('.')[0];

        const statsRow = await get(
            `SELECT 
               SUM(completed_minutes) as todayMinutes,
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as pomoCount
             FROM focus_sessions 
             WHERE user_id = ? AND started_at >= ?`,
            [userId, startOfDay]
        );

        return res.json({
            ok: true,
            todayMinutes: statsRow?.todayMinutes || 0,
            pomoCount: statsRow?.pomoCount || 0
        });
    } catch (err) {
        console.error('Errore stop sessione:', err);
        res.status(500).json({ error: 'focus_stop_failed' });
    }
});

// --- API SUONI AMBIENTALI ---

const AmbientModel = require('../models/AmbientModel');

// GET /api/focus/ambient - Recupera preferenze suoni utente
router.get('/ambient', async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.json([]);
        const prefs = await AmbientModel.getPreferences(req.user.id);
        res.json(prefs);
    } catch (err) {
        console.error('Ambient Get Error:', err);
        res.status(500).json({ error: 'Errore recupero preferenze' });
    }
});

// POST /api/focus/ambient/preference - Aggiorna preferenza singolo suono
router.post('/ambient/preference', ensureAuthenticated, async (req, res) => {
    try {
        const { soundId, volume, isActive } = req.body;
        // Salva volume e stato (attivo/spento) per il suono specifico
        await AmbientModel.setPreference(req.user.id, soundId, volume, isActive);
        res.json({ ok: true });
    } catch (err) {
        console.error('Ambient Pref Error:', err);
        res.status(500).json({ error: 'Errore salvataggio preferenza' });
    }
});

// POST /api/focus/ambient/reset-active - Spegne tutti i suoni (Sync logica)
router.post('/ambient/reset-active', ensureAuthenticated, async (req, res) => {
    try {
        // Imposta isActive=0 per tutti i suoni dell'utente
        await AmbientModel.resetAllActive(req.user.id);
        res.json({ ok: true });
    } catch (err) {
        console.error('Ambient Reset Active Error:', err);
        res.status(500).json({ error: 'Errore reset suoni attivi' });
    }
});

// POST /api/focus/ambient/stats - Aggiornamento batch statistiche ascolto
router.post('/ambient/stats', ensureAuthenticated, async (req, res) => {
    try {
        const { stats } = req.body; // Array di oggetti { soundId, seconds }
        if (stats && Array.isArray(stats) && stats.length > 0) {
            await AmbientModel.incrementStats(req.user.id, stats);
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Ambient Stats Error:', err);
        // Non blocchiamo il frontend se fallisce il tracciamento stats
        res.status(200).json({ ok: false });
    }
});


// Recupera la lista dei suoni ambientali disponibili
router.get('/ambient-list', async (req, res) => {
    try {
        const sounds = await all(`
            SELECT s.id, s.title as label, s.icon, s.filename as file, s.category, 'ambient' as folder
            FROM sounds s 
            LEFT JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient'
        `);

        // Assegna la cartella di default se non presente
        const mapped = sounds.map(s => ({ ...s, folder: s.folder || 'ambient' }));
        res.json(mapped);
    } catch (err) {
        console.error('Errore nel recupero lista suoni ambientali:', err);
        res.status(500).json({ error: 'Errore recupero lista suoni' });
    }
});

module.exports = router;
