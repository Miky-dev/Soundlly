const { run, get, all } = require('../db/sqlite');

class AmbientModel {
    // --- Preferences ---

    // Get all preferences for a user
    static async getPreferences(userId) {
        // Returns array of { sound_id, volume, is_active }
        return await all(
            `SELECT sound_id, volume, is_active FROM user_ambient_sounds WHERE user_id = ?`,
            [userId]
        );
    }

    // Set preference for a single sound (Upsert)
    static async setPreference(userId, soundId, volume, isActive) {
        // SQLite upsert using REPLACE or INSERT OR REPLACE
        return await run(
            `INSERT OR REPLACE INTO user_ambient_sounds (user_id, sound_id, volume, is_active, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, soundId, volume, isActive ? 1 : 0]
        );
    }

    // Reset all preferences to inactive for a user
    static async resetAllActive(userId) {
        return await run(
            `UPDATE user_ambient_sounds SET is_active = 0 WHERE user_id = ?`,
            [userId]
        );
    }

    // --- Statistics ---

    // Increment listening time safely
    static async incrementStats(userId, batchStats) {
        // batchStats is array of { soundId, seconds }
        // Process sequentially or parallel
        const promises = batchStats.map(({ soundId, seconds }) => {
            // 1. Upsert stats for the user
            const userStatsPromise = run(
                `INSERT INTO ambient_listening_stats (user_id, sound_id, total_seconds, last_listened_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, sound_id) DO UPDATE SET
            total_seconds = total_seconds + excluded.total_seconds,
            last_listened_at = CURRENT_TIMESTAMP`,
                [userId, soundId, seconds]
            );

            // 2. Increment global stats for the sound (for owner profile)
            // 2. Increment global stats for the sound (for owner profile)
            // REMOVED: total_play_seconds column no longer exists.

            return userStatsPromise;
        });
        return Promise.all(promises);
    }
}

module.exports = AmbientModel;
