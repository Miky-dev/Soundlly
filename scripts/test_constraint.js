const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function runTest() {
    console.log('--- START VERIFICATION ---');

    // 1. Valid Insert: Ambient (no icon needed)
    db.run(`
        INSERT INTO sounds (owner_id, title, filename, category, icon)
        VALUES (1, 'Test Ambient', 'test.mp3', 'ambient', NULL)
    `, function (err) {
        if (err) console.error("FAIL: Ambient Insert Failed:", err.message);
        else console.log("PASS: Ambient Insert Success (ID: " + this.lastID + ")");
    });

    // 2. Valid Insert: Music WITH Icon
    db.run(`
        INSERT INTO sounds (owner_id, title, filename, category, icon)
        VALUES (1, 'Test Music Valid', 'music.mp3', 'music', '/path/to/cover.jpg')
    `, function (err) {
        if (err) console.error("FAIL: Music Valid Insert Failed:", err.message);
        else console.log("PASS: Music Valid Insert Success (ID: " + this.lastID + ")");
    });

    // 3. INVALID Insert: Music WITHOUT Icon
    db.run(`
        INSERT INTO sounds (owner_id, title, filename, category, icon)
        VALUES (1, 'Test Music Invalid', 'music_bad.mp3', 'music', NULL)
    `, function (err) {
        if (err && err.message.includes('CHECK constraint failed')) {
            console.log("PASS: Music Invalid Insert Blocked Correctly (" + err.message + ")");
        } else if (err) {
            console.error("FAIL: Unexpected Error:", err.message);
        } else {
            console.error("FAIL: Music Invalid Insert SUCCEEDED (It should have failed!)");
        }
    });

}

setTimeout(runTest, 1000); 
