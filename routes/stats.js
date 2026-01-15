const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// GET /stats
// Helper to get start of day/week/month in ISO format
const getStartDates = () => {
    const now = new Date();

    // Helper to format for SQLite (YYYY-MM-DD HH:MM:SS)
    const toSqlite = (d) => d.toISOString().replace('T', ' ').split('.')[0];

    const startOfDay = toSqlite(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    const startOfWeekDate = new Date(now);
    const day = startOfWeekDate.getDay() || 7; // Get current day number, converting Sun (0) to 7
    if (day !== 1) startOfWeekDate.setHours(-24 * (day - 1)); // Go back to Monday
    startOfWeekDate.setHours(0, 0, 0, 0);
    const startOfWeek = toSqlite(startOfWeekDate);

    const startOfMonth = toSqlite(new Date(now.getFullYear(), now.getMonth(), 1));

    return { startOfDay, startOfWeek, startOfMonth };
};

// GET /stats
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfDay, startOfWeek, startOfMonth } = getStartDates();

        // 0. Ensure User Goals Exist
        let userGoals = await get(`SELECT * FROM user_goals WHERE user_id = ?`, [userId]);
        if (!userGoals) {
            await run(`INSERT INTO user_goals (user_id) VALUES (?)`, [userId]);
            userGoals = { daily_focus_goal: 60, weekly_focus_goal: 300, monthly_focus_goal: 1200 };
        }

        // 1. Focus Stats (Total)
        const focusStats = await get(
            `SELECT 
             SUM(completed_minutes) as totalMinutes, 
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as totalSessions 
           FROM focus_sessions 
           WHERE user_id = ?`,
            [userId]
        );

        // 1b. Progress Stats (Daily, Weekly, Monthly)
        const progressStats = await get(
            `SELECT 
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as todayMinutes,
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as weekMinutes,
                SUM(CASE WHEN started_at >= ? THEN completed_minutes ELSE 0 END) as monthMinutes
             FROM focus_sessions
             WHERE user_id = ?`,
            [startOfDay, startOfWeek, startOfMonth, userId]
        );

        // 2. To-Do Stats
        const todoCompleted = await get(`SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_done = 1`, [userId]);
        const todoPending = await get(`SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_done = 0`, [userId]);

        // 3. Ambient Sounds Stats (Top 5)
        const topSounds = await all(
            `SELECT s.title, a.sound_id, a.total_seconds, a.last_listened_at 
                 FROM ambient_listening_stats a
                 JOIN sounds s ON a.sound_id = s.id
                 WHERE a.user_id = ? 
                 ORDER BY a.total_seconds DESC 
                 LIMIT 5`,
            [userId]
        );

        // 4. Recent Focus Sessions (Last 5)
        const recentSessions = await all(
            `SELECT started_at, session_type, completed_minutes, status 
                 FROM focus_sessions 
                 WHERE user_id = ? 
                 ORDER BY started_at DESC 
                 LIMIT 5`,
            [userId]
        );

        // 5. Weekly Chart Data (Last 7 Days)
        const chartLabels = [];
        const chartData = [];
        const today = new Date();

        // Generate last 7 days dates
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            chartLabels.push(d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }));
        }

        // Get raw data from DB
        const rawChartData = await all(`
            SELECT date(started_at) as dateDay, SUM(completed_minutes) as minutes
            FROM focus_sessions
            WHERE user_id = ? AND started_at >= date('now', '-6 days')
            GROUP BY dateDay
            ORDER BY dateDay ASC
        `, [userId]);

        // Map DB data to the 7 days array (filling missing days with 0)
        // Since we only need the values corresponding to chartLabels order, we can do a simpler match
        // But to be precise with dates, let's reconstruct:
        const dataMap = {};
        if (rawChartData) {
            rawChartData.forEach(row => {
                // SQLite date() returns YYYY-MM-DD
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

// POST /stats/goals - Update Goals
router.post('/goals', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            daily_hours, daily_minutes,
            weekly_hours, weekly_minutes,
            monthly_hours, monthly_minutes
        } = req.body;

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
