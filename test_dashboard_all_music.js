const { all } = require('./db/sqlite');

(async () => {
    try {
        const music = await all(`
            SELECT s.id, s.title, s.category, u.username as owner_name, u.role
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'music'
        `);
        console.log('All Music (Admin Panel):', JSON.stringify(music, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
