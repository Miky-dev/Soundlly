const { run } = require('./db/sqlite');

(async () => {
    try {
        console.log('Inserting additional test data...');
        // Ensure user 1 exists (created in previous step)

        // Insert Premium Sound
        await run(`INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, category, mood, genre_primary) 
               VALUES (1, 'Exclusive Synth', 'Traccia Premium Esclusiva', 'premium_1.mp3', 'audio', 'premium', 'music', 'energetic', 'synthwave')`);

        // Get ID of the new sound (assuming likely ID 5 if 1-4 were previous) or just insert a favorite for existing sound ID 1
        // Let's Favorite Sound ID 1 ("Melodia Rilassante")
        await run(`INSERT OR IGNORE INTO sound_likes (user_id, sound_id) VALUES (1, 1)`);

        console.log('Additional test data inserted successfully.');
    } catch (err) {
        console.error('Error inserting data:', err);
    }
})();
