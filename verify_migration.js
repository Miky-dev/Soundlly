const { db } = require('./db/sqlite');

db.all("SELECT id, title, owner_id FROM sounds WHERE category = 'ambient' ORDER BY id DESC LIMIT 5", (err, rows) => {
    if (err) console.error(err);
    else {
        console.log("Recent Ambient Sounds:");
        console.log(rows);

        db.get("SELECT id FROM users WHERE username='System'", (e, u) => {
            console.log("System User ID: " + (u ? u.id : 'Not Found'));
        });
    }
});
