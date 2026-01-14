const { run, all } = require('./db/sqlite');

(async () => {
    try {
        console.log('--- Setting up Test Data ---');

        // 1. Create a dummy non-admin user
        // We use a random suffix to avoid unique constraint errors if run multiple times
        const suffix = Math.floor(Math.random() * 10000);
        const username = `TestUser_${suffix}`;

        // We don't need a real password hash for this test, just the record
        const userRes = await run(
            `INSERT INTO users (username, password_hash, role) VALUES (?, 'dummyhash', 'user')`,
            [username]
        );
        const userId = userRes.lastID;
        console.log(`Created dummy user: ${username} (ID: ${userId})`);

        // 2. Create a sound owned by this user
        const title = `Test Song ${suffix}`;
        await run(
            `INSERT INTO sounds (owner_id, title, description, filename, media_type, category, access_level, icon) 
             VALUES (?, ?, 'User Upload Test', 'test.mp3', 'audio', 'music', 'public', 'fa-music')`,
            [userId, title]
        );
        console.log(`Created sound: ${title} owned by ${username}`);

        // 3. Run the Admin Panel Query
        const userSongs = await all(`
            SELECT s.id, s.title, u.username as owner_name 
            FROM sounds s 
            JOIN users u ON s.owner_id = u.id 
            WHERE u.role != 'admin'
        `);

        console.log('--- Admin Panel Query Result ---');
        console.log(JSON.stringify(userSongs, null, 2));

        if (userSongs.length > 0) {
            console.log('SUCCESS: The non-admin sound was found!');
        } else {
            console.log('FAILURE: The sound was not found.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
})();
