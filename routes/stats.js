const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * Helper per il calcolo delle date
 * Determina l'inizio del giorno, della settimana (lunedì) e del mese corrente.
 * Restituisce le date formattate per SQLite (YYYY-MM-DD HH:MM:SS)
 */
const getStartDates = () => {
    const now = new Date();

    // Formatta data per SQLite
    const toSqlite = (d) => d.toISOString().replace('T', ' ').split('.')[0];

    // Inizio Giorno
    const startOfDay = toSqlite(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    // Inizio Settimana (Lunedì)
    const startOfWeekDate = new Date(now);
    const day = startOfWeekDate.getDay() || 7; // 0=Dom -> converte a 7
    if (day !== 1) startOfWeekDate.setHours(-24 * (day - 1)); // Torna indietro a Lunedì
    startOfWeekDate.setHours(0, 0, 0, 0);
    const startOfWeek = toSqlite(startOfWeekDate);

    // Inizio Mese
    const startOfMonth = toSqlite(new Date(now.getFullYear(), now.getMonth(), 1));

    return { startOfDay, startOfWeek, startOfMonth };
};

// Recupera le statistiche utente: obiettivi, sessioni completate, task e grafici
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfDay, startOfWeek, startOfMonth } = getStartDates();

        // Verifica e inizializza gli obiettivi dell'utente se non esistono
        let userGoals = await get(`SELECT * FROM user_goals WHERE user_id = ?`, [userId]);
        if (!userGoals) {
            await run(`INSERT INTO user_goals (user_id) VALUES (?)`, [userId]);
            userGoals = { daily_focus_goal: 60, weekly_focus_goal: 300, monthly_focus_goal: 1200 };
        }

        // Calcolo delle statistiche totali delle sessioni di focus
        const focusStats = await get(
            `SELECT 
             SUM(completed_minutes) as totalMinutes, 
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as totalSessions 
           FROM focus_sessions 
           WHERE user_id = ?`,
            [userId]
        );

        // Calcolo del progresso temporale (Oggi, Settimana, Mese)
        const progressStats = await get(
            `SELECT 
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as todayMinutes,
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as weekMinutes,
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as monthMinutes
             FROM focus_sessions
             WHERE user_id = ?`,
            [startOfDay, startOfWeek, startOfMonth, userId]
        );

        // Statistiche dei Task (To-Do) completati e in sospeso
        const todoCompleted = await get(`SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_done = 1`, [userId]);
        const todoPending = await get(`SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_done = 0`, [userId]);

        // Recupera la top 5 dei suoni ambientali più ascoltati
        const topSounds = await all(
            `SELECT s.title, a.sound_id, a.total_seconds, a.last_listened_at 
                 FROM ambient_listening_stats a
                 JOIN sounds s ON a.sound_id = s.id
                 WHERE a.user_id = ? 
                 ORDER BY a.total_seconds DESC 
                 LIMIT 5`,
            [userId]
        );

        // Recupera le ultime 5 sessioni di focus svolte
        const recentSessions = await all(
            `SELECT started_at, session_type, completed_minutes, status 
                 FROM focus_sessions 
                 WHERE user_id = ? 
                 ORDER BY started_at DESC 
                 LIMIT 5`,
            [userId]
        );

        // Preparazione dati per il grafico dell'attività settimanale (ultimi 7 giorni)
        const chartLabels = [];
        const today = new Date();

        // Genera etichette per gli ultimi 7 giorni
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            chartLabels.push(d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }));
        }

        // Recupera dati grezzi dal DB raggruppati per giorno
        const rawChartData = await all(`
            SELECT date(started_at) as dateDay, SUM(completed_minutes) as minutes
            FROM focus_sessions
            WHERE user_id = ? AND started_at >= date('now', '-6 days')
            GROUP BY dateDay
            ORDER BY dateDay ASC
        `, [userId]);

        // Mappatura dati DB sull'array dei 7 giorni (riempie i buchi con 0)
        const dataMap = {};
        if (rawChartData) {
            rawChartData.forEach(row => {
                dataMap[row.dateDay] = row.minutes;
            });
        }

        const finalChartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            finalChartData.push(dataMap[dateStr] || 0);
        }

        // Renderizza la vista
        res.render('stats', {
            user: req.user,
            totalFocusMinutes: focusStats?.totalMinutes || 0,
            completedSessions: focusStats?.totalSessions || 0,
            completedTodos: todoCompleted?.count || 0,
            pendingTodos: todoPending?.count || 0,
            topSounds: topSounds || [],
            recentSessions: recentSessions || [],
            userGoals,
            progress: {
                today: progressStats?.todayMinutes || 0,
                week: progressStats?.weekMinutes || 0,
                month: progressStats?.monthMinutes || 0
            },
            chart: {
                labels: chartLabels,
                data: finalChartData
            }
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.redirect('/home?error=stats_error');
    }
});

// Aggiorna gli obiettivi di tempo dell'utente (giornaliero, settimanale, mensile)
router.post('/goals', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            daily_hours, daily_minutes,
            weekly_hours, weekly_minutes,
            monthly_hours, monthly_minutes
        } = req.body;

        // Conversione tutto in minuti
        const dailyTotal = (parseInt(daily_hours) || 0) * 60 + (parseInt(daily_minutes) || 0);
        const weeklyTotal = (parseInt(weekly_hours) || 0) * 60 + (parseInt(weekly_minutes) || 0);
        const monthlyTotal = (parseInt(monthly_hours) || 0) * 60 + (parseInt(monthly_minutes) || 0);

        await run(
            `UPDATE user_goals 
             SET daily_focus_goal = ?, weekly_focus_goal = ?, monthly_focus_goal = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ?`,
            [dailyTotal, weeklyTotal, monthlyTotal, userId]
        );

        res.redirect('/stats?success=goals_updated');
    } catch (err) {
        console.error("Update Goals Error:", err);
        res.redirect('/stats?error=update_failed');
    }
});

module.exports = router;
