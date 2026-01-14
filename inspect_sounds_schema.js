const { all } = require('./db/sqlite');

(async () => {
    try {
        const schema = await all("PRAGMA table_info(sounds)");
        console.log(JSON.stringify(schema, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
