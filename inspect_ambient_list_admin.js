const { all } = require('./db/sqlite');

(async () => {
    try {
        const sounds = await all(`
            SELECT s.id, s.title as label, s.icon, s.filename as file, s.category, u.role, u.username 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE s.category = 'ambient' AND u.role = 'admin'
        `);
        console.log('Filtered Admin Sounds:', JSON.stringify(sounds, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
