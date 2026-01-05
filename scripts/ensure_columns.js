const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const COLUMNS_TO_ENSURE = [
    { name: 'born_city', type: 'TEXT' },
    { name: 'date_of_birth', type: 'DATE' },
    { name: 'mood', type: 'TEXT' },
    { name: 'subscription_expiry', type: 'DATE' }
];

db.serialize(() => {
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error("Error getting table info:", err);
            return;
        }

        const existingColumns = rows.map(r => r.name);
        console.log("Existing columns:", existingColumns);

        COLUMNS_TO_ENSURE.forEach(col => {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding missing column: ${col.name}`);
                db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
                    if (err) console.error(`Failed to add ${col.name}:`, err.message);
                    else console.log(`Successfully added ${col.name}`);
                });
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        });
    });
});

db.close();
