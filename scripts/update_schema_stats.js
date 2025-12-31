const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function runQuery(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function migrate() {
    console.log("Starting stats schema update...");

    // Add total_play_seconds to sounds table
    try {
        await runQuery(`ALTER TABLE sounds ADD COLUMN total_play_seconds INTEGER DEFAULT 0`);
        console.log("Added total_play_seconds column to sounds table.");
    } catch (err) {
        if (err.message && err.message.includes('duplicate column')) {
            console.log("Column total_play_seconds already exists.");
        } else {
            console.error("Error adding column:", err.message);
        }
    }

    db.close();
    console.log("Stats schema update finished.");
}

migrate();
