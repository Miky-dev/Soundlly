const { db } = require('./db/sqlite');

db.all("SELECT id, title, category, owner_id FROM sounds WHERE category = 'ambient'", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Found " + rows.length + " ambient sounds.");
        rows.forEach(r => {
            console.log(`[${r.id}] ${r.title} - Owner: ${r.owner_id}`);
        });
    }
});
