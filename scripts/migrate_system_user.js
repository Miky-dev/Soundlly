const { db, run, get } = require('../db/sqlite');
const bcrypt = require('bcrypt');

(async () => {
    try {
        console.log("Starting System User Migration...");

        // 1. Create System User if not exists
        const hash = await bcrypt.hash('system_secure_pass', 10);
        await run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES ('System', ?, 'admin')`, [hash]);

        const sysUser = await get(`SELECT id FROM users WHERE username='System'`);
        if (!sysUser) throw new Error("Could not create/find System user");
        console.log("System User ID:", sysUser.id);

        // 2. Migrate EXISTING ambient sounds (Box 4 candidates) to System User
        // We migrate ALL sounds currently in 'ambient' category that are owned by Admin (1)
        // OR we migrate ALL ambient sounds regardless? 
        // Safer: Migrate ALL 'ambient' sounds to System.
        // If the admin had "personal" ambient sounds, they become System sounds. 
        // This is a one-time setup. Future uploads by Admin will stay Admin.

        await run(`UPDATE sounds SET owner_id = ? WHERE category = 'ambient'`, [sysUser.id]);

        console.log("Migration Complete. All ambient sounds are now owned by System.");

        // Debug
        const count = await get(`SELECT count(*) as c FROM sounds WHERE owner_id = ?`, [sysUser.id]);
        console.log(`Verified: ${count.c} sounds owned by System.`);

    } catch (e) {
        console.error("Migration Failed:", e);
    }
})();
