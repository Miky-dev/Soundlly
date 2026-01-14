const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// GET /api/focus/settings
// GET /api/focus/settings (Public - defaults for guests)
router.get('/settings', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            const MODES = {
                pomodoro: { minutes: 25, label: 'Pomodoro', color: '#2a9d8f' },
                shortBreak: { minutes: 5, label: 'Pausa Breve', color: '#e9c46a' }
            };
            return res.json({
                pomodoro: MODES.pomodoro.minutes,
                shortBreak: MODES.shortBreak.minutes
            });
        }
        const userId = req.user.id;
        // defaults if null
        const row = await get(`SELECT focus_minutes, short_break_minutes FROM users WHERE id=?`, [userId]);
        const MODES = {
            pomodoro: { minutes: 25, label: 'Pomodoro', color: '#2a9d8f' },
            shortBreak: { minutes: 5, label: 'Pausa Breve', color: '#e9c46a' }
        };
        res.json({
            pomodoro: row?.focus_minutes || MODES.pomodoro.minutes,
            shortBreak: row?.short_break_minutes || MODES.shortBreak.minutes
        });
    } catch (err) {
        console.error('get settings error', err);
        res.status(500).json({ error: 'failed' });
    }
});

// POST /api/focus/settings
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
        console.error('save settings error', err);
        res.status(500).json({ error: 'failed' });
    }
});

// POST /api/focus/start
router.post('/start', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { session_type = 'pomodoro', planned_minutes = 25 } = req.body || {};
        // Insert new session with status 'in_progress'
        const result = await run(
            `INSERT INTO focus_sessions (user_id, session_type, planned_minutes, status)
       VALUES (?, ?, ?, 'in_progress')`,
            [userId, session_type, Math.max(1, +planned_minutes || 25)]
        );
        return res.json({ ok: true, session_id: result.lastID });
    } catch (err) {
        console.error('focus/start error:', err);
        res.status(500).json({ error: 'focus_start_failed' });
    }
});

// POST /api/focus/stop
router.post('/stop', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { session_id, completed_minutes = 0, status = 'completed' } = req.body || {};

        if (!session_id) return res.status(400).json({ error: 'session_id_required' });

        // Verify session ownership
        const row = await get(`SELECT id FROM focus_sessions WHERE id=? AND user_id=?`, [session_id, userId]);
        if (!row) return res.status(404).json({ error: 'session_not_found' });

        // Validate status
        const validStatuses = ['in_progress', 'completed', 'interrupted', 'abandoned'];
        const finalStatus = validStatuses.includes(status) ? status : 'completed';

        await run(
            `UPDATE focus_sessions
         SET completed_minutes=?, status=?, ended_at=CURRENT_TIMESTAMP
       WHERE id=?`,
            [completed_minutes, finalStatus, session_id]
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error('focus/stop error:', err);
        res.status(500).json({ error: 'focus_stop_failed' });
    }
});

// --- Ambient Sounds API ---

const AmbientModel = require('../models/AmbientModel');

// Get Preferences (Public - empty for guests)
router.get('/ambient', async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.json([]);
        const prefs = await AmbientModel.getPreferences(req.user.id);
        res.json(prefs);
    } catch (err) {
        console.error('Ambient Get Error:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update Preference (Single)
router.post('/ambient/preference', ensureAuthenticated, async (req, res) => {
    try {
        const { soundId, volume, isActive } = req.body;
        await AmbientModel.setPreference(req.user.id, soundId, volume, isActive);
        res.json({ ok: true });
    } catch (err) {
        console.error('Ambient Pref Error:', err);
        res.status(500).json({ error: 'Failed to save setting' });
    }
});

// Batch Update Stats
router.post('/ambient/stats', ensureAuthenticated, async (req, res) => {
    try {
        const { stats } = req.body; // Array of { soundId, seconds }
        if (stats && Array.isArray(stats) && stats.length > 0) {
            await AmbientModel.incrementStats(req.user.id, stats);
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Ambient Stats Error:', err);
        // Don't crash frontend for stats failure
        res.status(200).json({ ok: false });
    }
});


// Get List of Available Ambient Sounds
router.get('/ambient-list', async (req, res) => {
    try {
        const sounds = await all(`
            SELECT s.id, s.title as label, s.icon, s.filename as file 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient' AND u.role = 'admin'
        `);
        res.json(sounds);
    } catch (err) {
        console.error('Ambient List Error:', err);
        res.status(500).json({ error: 'Failed to fetch sound list' });
    }
});

module.exports = router;
