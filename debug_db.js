const { all } = require('./db/sqlite');
const fs = require('fs');

async function check() {
    setTimeout(async () => {
        try {
            const sounds = await all(`
                SELECT s.id, s.title, s.category, s.owner_id, u.username, u.role
                FROM sounds s 
                LEFT JOIN users u ON s.owner_id = u.id
            `);
            fs.writeFileSync('db_dump.json', JSON.stringify(sounds, null, 2));
            console.log("Dump written to db_dump.json");
        } catch (e) {
            console.error(e);
        }
    }, 1000);
}

check();
