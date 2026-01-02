const { run } = require('./db/sqlite');

(async () => {
    try {
        console.log('Inserting test data...');
        await run("INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (1, 'TestAuthor', 'hash', 'creator')");
        await run("INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, category, mood, genre_primary) VALUES (1, 'Melodia Rilassante', 'Una traccia calma per studiare', 'test_song_1.mp3', 'audio', 'public', 'music', 'calm', 'lofi')");
        await run("INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, category, mood, genre_primary) VALUES (1, 'Pioggia Leggera', 'Suono della pioggia che cade', 'rain_test.mp3', 'audio', 'public', 'ambient', 'relaxing', 'nature')");
        await run("INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, category, mood, genre_primary) VALUES (1, 'Beats for Focus', 'Ritmo costante per la concentrazione', 'beat_test.mp3', 'audio', 'public', 'music', 'focus', 'electronic')");
        console.log('Test data inserted successfully.');
    } catch (err) {
        console.error('Error inserting data:', err);
    }
})();
