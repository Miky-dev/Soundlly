const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const userId = 1; // Assuming default admin/user

// Replicate server.js logic
const now = new Date();
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

console.log(`Debug Info:`);
console.log(`Now (Local): ${now.toString()}`);
console.log(`StartOfDay (ISO used in Query): ${startOfDay}`);

const sql = `
SELECT 
    id, 
    started_at, 
    completed_minutes, 
    status,
    (started_at >= ?) as is_counted
FROM focus_sessions 
WHERE user_id = ? 
ORDER BY id DESC 
LIMIT 5`;

db.all(sql, [startOfDay, userId], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("\nRecent Sessions & Logic Check:");
        console.table(rows);
    }

    // Check Aggregation
    const aggSql = `
    SELECT 
        SUM(completed_minutes) as todayMinutes,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as pomoCount
    FROM focus_sessions 
    WHERE user_id = ? AND started_at >= ?`;

    db.get(aggSql, [userId, startOfDay], (err, row) => {
        if (err) console.error(err);
        else {
            console.log("\nAggregation Result (server.js logic):");
            console.log("todayMinutes:", row.todayMinutes);
            console.log("pomoCount:", row.pomoCount);
        }
        db.close();
    });
});
