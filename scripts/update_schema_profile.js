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
    const columns = [
        'ALTER TABLE users ADD COLUMN birth_place TEXT',
        'ALTER TABLE users ADD COLUMN subscription_expiry DATETIME'
    ];

    console.log("Starting schema update...");

    for (const sql of columns) {
        try {
            await runQuery(sql);
            console.log(`Executed: ${sql}`);
        } catch (err) {
            if (err.message && err.message.includes('duplicate column')) {
                console.log(`Skipped (already exists): ${sql}`);
            } else {
                console.error(`Error executing ${sql}:`, err.message);
            }
        }
    }

    db.close();
    console.log("Schema update finished.");
}

migrate();
