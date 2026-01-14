const { all } = require('./db/sqlite');

(async () => {
    try {
        const userSongs = await all(`
            SELECT s.id, s.title, s.category, u.username as owner_name, u.role
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE u.role != 'admin'
        `);
        console.log('User Songs (Admin Panel):', JSON.stringify(userSongs, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
