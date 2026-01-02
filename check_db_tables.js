const { all } = require('./db/sqlite');

(async () => {
    try {
        const tables = await all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', JSON.stringify(tables, null, 2));

        for (const t of tables) {
            if (t.name === 'users' || t.name === 'sounds' || t.name.includes('fav')) {
                const schema = await all(`PRAGMA table_info(${t.name})`);
                console.log(`Schema for ${t.name}:`, JSON.stringify(schema, null, 2));
            }
        }

        // Also check explicit "user_favorites" or similar if "fav" doesn't catch it
    } catch (err) {
        console.error(err);
    }
})();
