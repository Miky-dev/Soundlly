const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Fixing database schema...');

db.serialize(() => {
    // Force add icon column
    db.run("ALTER TABLE sounds ADD COLUMN icon TEXT", (err) => {
        if (err) {
            console.log("Column might already exist or error:", err.message);
        } else {
            console.log("SUCCESS: Added 'icon' column to sounds table.");
        }
    });

    // Verify it exists now
    db.all("PRAGMA table_info(sounds)", (err, rows) => {
        if (err) console.error(err);
        else {
            const hasIcon = rows.some(r => r.name === 'icon');
            console.log("Verification - Table 'sounds' has 'icon' column?", hasIcon);
        }
    });
});
