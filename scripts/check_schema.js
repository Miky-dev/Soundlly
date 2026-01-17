const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- START COLUMNS ---');
db.all("PRAGMA table_info(sounds)", (err, rows) => {
    if (err) {
        console.error("Error:", err);
        return;
    }
    rows.forEach(row => {
        console.log(`Column[${row.cid}]: ${row.name} (${row.type})`);
    });
});
db.close();
