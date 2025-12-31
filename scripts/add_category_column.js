const { run } = require('../db/sqlite');

(async () => {
    try {
        console.log('Adding category column to sounds table...');
        await run(`ALTER TABLE sounds ADD COLUMN category TEXT DEFAULT 'ambient' CHECK (category IN ('ambient', 'music'))`);
        console.log('Column added successfully.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.error('Error adding column:', err);
        }
    }
})();
