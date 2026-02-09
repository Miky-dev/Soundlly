const { db, run, get } = require('../db/sqlite');
const bcrypt = require('bcrypt');

/**
 * Script per migrare la proprietà dei suoni ambientali a un utente di sistema dedicato.
 * Questo assicura che i suoni "ufficiali" della piattaforma siano separati dai caricamenti degli utenti.
 */
(async () => {
    try {
        console.log("Inizio migrazione utente di sistema...");

        // 1. Creazione dell'utente 'System' se non esiste già
        // Usiamo una password sicura (hashata) per l'utente amministrativo di sistema
        const hash = await bcrypt.hash('system_secure_pass', 10);
        await run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES ('System', ?, 'admin')`, [hash]);

        const sysUser = await get(`SELECT id FROM users WHERE username='System'`);
        if (!sysUser) {
            throw new Error("Impossibile creare o trovare l'utente System.");
        }
        console.log("ID Utente di Sistema:", sysUser.id);

        // 2. Migrazione dei suoni ambientali esistenti
        // Tutti i suoni nella categoria 'ambient' vengono assegnati all'utente System.
        // Questa è un'operazione di setup una tantum.
        console.log("Assegnazione suoni ambientali all'utente System...");
        await run(`UPDATE sounds SET owner_id = ? WHERE category = 'ambient'`, [sysUser.id]);

        // Verifica della migrazione
        const count = await get(`SELECT count(*) as c FROM sounds WHERE owner_id = ?`, [sysUser.id]);
        console.log(`Migrazione completata con successo: ${count.c} suoni ora appartengono a System.`);

    } catch (err) {
        console.error("Errore durante la migrazione:", err.message);
    }
})();
