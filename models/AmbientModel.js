const { run, get, all } = require('../db/sqlite');

class AmbientModel {
    // --- Preferenze ---

    // Ottiene tutte le preferenze per un utente
    static async getPreferences(userId) {
        // Restituisce un array di oggetti { sound_id, volume, is_active }
        return await all(
            `SELECT sound_id, volume, is_active FROM user_ambient_sounds WHERE user_id = ?`,
            [userId]
        );
    }

    // Imposta la preferenza per un singolo suono (Upsert)
    static async setPreference(userId, soundId, volume, isActive) {
        // Usa REPLACE o INSERT OR REPLACE per gestire l'aggiornamento o l'inserimento
        return await run(
            `INSERT OR REPLACE INTO user_ambient_sounds (user_id, sound_id, volume, is_active, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, soundId, volume, isActive ? 1 : 0]
        );
    }

    // Resetta tutte le preferenze a "non attivo" per un utente
    static async resetAllActive(userId) {
        return await run(
            `UPDATE user_ambient_sounds SET is_active = 0 WHERE user_id = ?`,
            [userId]
        );
    }

    // --- Statistiche ---

    // Incrementa il tempo di ascolto in modo sicuro
    static async incrementStats(userId, batchStats) {
        // batchStats è un array di { soundId, seconds }
        // Processiamo le statistiche in parallelo mappando le Promise
        const promises = batchStats.map(({ soundId, seconds }) => {
            // Aggiorna le statistiche personali dell'utente (Upsert con ON CONFLICT)
            const userStatsPromise = run(
                `INSERT INTO ambient_listening_stats (user_id, sound_id, total_seconds, last_listened_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, sound_id) DO UPDATE SET
            total_seconds = total_seconds + excluded.total_seconds,
            last_listened_at = CURRENT_TIMESTAMP`,
                [userId, soundId, seconds]
            );

            return userStatsPromise;
        });
        return Promise.all(promises);
    }
}

module.exports = AmbientModel;
