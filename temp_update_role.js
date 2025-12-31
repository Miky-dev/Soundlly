const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile);

const username = 'admin';
const newRole = 'admin';

db.run("UPDATE users SET role = ? WHERE username = ?", [newRole, username], function (err) {
    if (err) {
        console.error("Error updating role:", err.message);
    } else {
        console.log(`Row(s) updated: ${this.changes}`);
        if (this.changes === 0) {
            console.log(`User '${username}' not found.`);
        } else {
            console.log(`User '${username}' is now an Admin.`);
        }
    }
    db.close();
});
