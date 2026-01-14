const { all } = require('./db/sqlite');

(async () => {
    try {
        const sounds = await all(`SELECT id, title, category, owner_id, icon FROM sounds LIMIT 20`);
        console.log('Sounds Sample:', JSON.stringify(sounds, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
