const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbFile);

const ambientSounds = [
    { id: 'rain', label: 'Pioggia', icon: 'fa-cloud-rain', file: 'pioggia.mp3' },
    { id: 'forest', label: 'Foresta', icon: 'fa-tree', file: 'foresta.mp3' },
    { id: 'fire', label: 'Fuoco', icon: 'fa-fire', file: 'fuoco.mp3' },
    { id: 'waves', label: 'Onde', icon: 'fa-water', file: 'onde.mp3' },
    { id: 'wind', label: 'Vento', icon: 'fa-wind', file: 'vento.mp3' },
    { id: 'night', label: 'Notte', icon: 'fa-moon', file: 'notte.mp3' },
    { id: 'cafe', label: 'Caffè', icon: 'fa-mug-hot', file: 'cafe.mp3' },
    { id: 'train', label: 'Treno', icon: 'fa-train', file: 'treno.mp3' }
];

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function migrate() {
    try {
        console.log('--- Starting Migration ---');

        // 1. Add `icon` column if not exists
        try {
            await run(`ALTER TABLE sounds ADD COLUMN icon TEXT`);
            console.log('Added `icon` column to sounds table.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column `icon` already exists.');
            } else {
                throw err;
            }
        }

        // 2. Add `is_system` column for protection? Maybe just use owner_id.
        // Let's use specific IDs or filenames to identify them.

        // 3. Insert Sounds
        // owner_id=1 (assuming admin exists or uses ID 1).
        // If no user 1, we might fail constraint. Let's check user 1 exists or use 0?
        // SQLite foreign keys are ON.

        // Check if user 1 exists, if not create a system placeholder?
        // For now let's assume valid owner_id is passed or found.
        // I will use `1` for now, if it fails I'll handle it.

        for (const sound of ambientSounds) {
            // Check if exists by filename (unique enough for system sounds)
            const existing = await new Promise((res, rej) => {
                db.get(`SELECT id FROM sounds WHERE filename = ?`, [sound.file], (err, row) => {
                    if (err) rej(err);
                    else res(row);
                });
            });

            if (!existing) {
                await run(
                    `INSERT INTO sounds (owner_id, title, description, filename, media_type, access_level, icon)
                     VALUES (?, ?, 'Suono Ambientale', ?, 'audio', 'public', ?)`,
                    [1, sound.label, sound.file, sound.icon]
                );
                console.log(`Inserted: ${sound.label}`);
            } else {
                // Update icon if missing
                await run(`UPDATE sounds SET icon = ? WHERE id = ?`, [sound.icon, existing.id]);
                console.log(`Updated: ${sound.label}`);
            }
        }

        console.log('--- Migration Complete ---');
        process.exit(0);

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
