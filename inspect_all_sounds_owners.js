const { all } = require('./db/sqlite');

(async () => {
    try {
        // Get all users to see roles
        const users = await all(`SELECT id, username, role FROM users`);
        console.log('Users:', JSON.stringify(users, null, 2));

        // Get all sounds to see owners
        const sounds = await all(`
            SELECT s.id, s.title, s.owner_id, u.username, u.role
            FROM sounds s
            LEFT JOIN users u ON s.owner_id = u.id
        `);
        console.log('All Sounds with Owners:', JSON.stringify(sounds, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
