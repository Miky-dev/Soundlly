const { all } = require('./db/sqlite');
const fs = require('fs');

(async () => {
    try {
        const schema = await all("PRAGMA table_info(sounds)");
        fs.writeFileSync('schema_output.json', JSON.stringify(schema, null, 2));
    } catch (err) {
        console.error(err);
        fs.writeFileSync('schema_output.json', JSON.stringify({ error: err.message }));
    }
})();
