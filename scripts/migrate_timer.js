const { run } = require('../db/sqlite');

(async () => {
    try {
        console.log('Adding timer columns to users table...');
        try { await run("ALTER TABLE users ADD COLUMN focus_minutes INTEGER DEFAULT 25"); } catch (e) { console.log('focus_minutes exists or error:', e.message); }
        try { await run("ALTER TABLE users ADD COLUMN short_break_minutes INTEGER DEFAULT 5"); } catch (e) { console.log('short_break_minutes exists or error:', e.message); }
        try { await run("ALTER TABLE users ADD COLUMN long_break_minutes INTEGER DEFAULT 15"); } catch (e) { console.log('long_break_minutes exists or error:', e.message); }
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
})();
