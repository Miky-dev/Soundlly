const { all } = require('./db/sqlite');

(async () => {
    try {
        console.log('--- ADMIN PANEL VERIFICATION ---');

        const ambient = await all(`SELECT id, title, category FROM sounds WHERE category = 'ambient'`);
        console.log(`Ambient Sounds (${ambient.length}):`, JSON.stringify(ambient, null, 2));

        const music = await all(`
            SELECT s.id, s.title, s.category, u.username as owner_name 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'music'
        `);
        console.log(`Music Tracks (${music.length}):`, JSON.stringify(music, null, 2));

    } catch (err) {
        console.error(err);
    }
})();
