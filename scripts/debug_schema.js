const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Checking focus_sessions schema...");
db.all("PRAGMA table_info(focus_sessions)", (err, rows) => {
    if (err) {
        console.error("Schema Error:", err);
    } else {
        console.log("Schema:", JSON.stringify(rows, null, 2));
    }
});

console.log("Checking recent sessions...");
db.all("SELECT * FROM focus_sessions ORDER BY id DESC LIMIT 5", (err, rows) => {
    if (err) {
        console.error("Data Error:", err);
    } else {
        console.log("Recent Data:", JSON.stringify(rows, null, 2));
    }
    db.close();
});
