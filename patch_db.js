const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    console.log("Applying patch to 'todos' table...");
    db.run("ALTER TABLE todos ADD COLUMN completed_at DATETIME", (err) => {
        if (err) {
            console.log("Column 'completed_at' might already exist or error:", err.message);
        } else {
            console.log("Success: Column 'completed_at' added.");
        }
    });

    // Also update existing completed items to have a date for stats consistency
    db.run("UPDATE todos SET completed_at = created_at WHERE is_done = 1 AND completed_at IS NULL", (err) => {
        if (err) console.error("Error backfilling dates:", err.message);
        else console.log("Backfilled dates for existing completed tasks.");
    });
});

db.close(() => {
    console.log("Database connection closed.");
});
