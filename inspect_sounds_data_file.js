const { all } = require('./db/sqlite');
const fs = require('fs');

(async () => {
    try {
        const sounds = await all(`SELECT id, title, category, owner_id, icon, access_level, is_restricted FROM sounds LIMIT 50`);
        fs.writeFileSync('sounds_data.json', JSON.stringify(sounds, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
