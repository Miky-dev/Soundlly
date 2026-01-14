const { all } = require('./db/sqlite');

(async () => {
    try {
        const sounds = await all(`SELECT id, title as label, icon, filename as file, category FROM sounds WHERE category = 'ambient'`);
        console.log('Filtered Sounds:', JSON.stringify(sounds, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
