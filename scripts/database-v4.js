const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const backupPath = path.join(__dirname, '..', 'database.sqlite.bak-v4');

console.log('--- START MIGRATION V4 ---');

// 1. Backup
if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Backup created at: ${backupPath}`);
} else {
    console.error('Database file not found!');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {

    // 2. Disable Foreign Keys
    db.run("PRAGMA foreign_keys = OFF");

    // 3. Rename old table
    console.log("Renaming old 'sounds' table...");
    db.run("ALTER TABLE sounds RENAME TO sounds_old", (err) => {
        if (err) {
            console.error("Error renaming sounds table:", err);
            return; // Try to continue or handle error
        }
    });

    // 4. Create new table with strict constraint and ICON column
    console.log("Creating new 'sounds' table...");
    db.run(`
        CREATE TABLE IF NOT EXISTS sounds (
          id                    INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id              INTEGER NOT NULL,
        
          -- Content
          title TEXT NOT NULL,
          description TEXT,
          filename TEXT NOT NULL, -- path
          media_type TEXT NOT NULL DEFAULT 'audio',
          duration_seconds INTEGER DEFAULT 0,
        
          -- Categorization
          mood TEXT,
          genre_primary TEXT,
        
          -- Access Control
          access_level TEXT NOT NULL DEFAULT 'public' CHECK (
              access_level IN (
                  'public',
                  'registered',
                  'premium',
                  'private'
              )
          ),
          category TEXT DEFAULT 'ambient' CHECK (
              category IN ('ambient', 'music')
          ),
          
          -- NEW: Icon/Cover Column with Constraint for Music
          icon TEXT, 
          
          is_restricted INTEGER NOT NULL DEFAULT 0 CHECK (is_restricted IN (0, 1)),
        
          -- Stats
          play_count INTEGER DEFAULT 0, 
          like_count INTEGER DEFAULT 0,
        
          -- Timestamps
          created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at            DATETIME,
          
          FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
          
          -- CONSTRAINT: If category is music, icon MUST NOT BE NULL
          CONSTRAINT check_music_has_cover CHECK (
             category != 'music' OR icon IS NOT NULL
          )
        );
    `, (err) => {
        if (err) {
            console.error("Error creating new sounds table:", err);
            process.exit(1);
        }
    });

    // 5. Indexing (Recreating indices)
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_owner ON sounds (owner_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_access ON sounds (access_level)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_created ON sounds (created_at DESC)");

    // 6. Copy Data
    console.log("Copying data from old table...");
    // Note: We blindly copy 'icon' if it existed, otherwise we might need default
    // We assume the old table might NOT have 'icon' in the schema file, 
    // but the live DB *might* (based on my earlier thought, but check_schema showed only category/mood etc. 
    // Actually check_schema showed NO icon column in the first attempt? 
    // Wait, the 'check_schema' output was chopped. 
    // Let's assume 'icon' column MIGHT be missing in old data, so we need to handle that.

    // We map:
    // id, owner_id, title, description, filename, media_type, access_level, category, mood, genre_primary, is_restricted, play_count, like_count, created_at, updated_at, deleted_at
    // AND we need to migrate 'icon' if it exists or provide default for music if missing.

    db.all("PRAGMA table_info(sounds_old)", (err, columns) => {
        const colNames = columns.map(c => c.name);
        const hasIcon = colNames.includes('icon');
        const hasDuration = colNames.includes('duration_seconds');

        let selectCols = `
           id, owner_id, title, description, filename, media_type, 
           access_level, category, mood, genre_primary, is_restricted, 
           play_count, like_count, created_at, updated_at, deleted_at
       `;

        if (hasDuration) selectCols += ", duration_seconds";
        else selectCols += ", 0 as duration_seconds";

        if (hasIcon) selectCols += ", icon";
        else selectCols += ", NULL as icon"; // Will fail constraint if music has null icon!

        const insertSql = `
         INSERT INTO sounds (
           id, owner_id, title, description, filename, media_type, 
           access_level, category, mood, genre_primary, is_restricted, 
           play_count, like_count, created_at, updated_at, deleted_at,
           duration_seconds, icon
         )
         SELECT 
            ${selectCols}
         FROM sounds_old
       `;

        db.run(insertSql, function (err) {
            if (err) {
                console.error("Error migrating data:", err);
                // Fallback: update Music items to have a default icon if migration failed due to constraint
                if (err.message.includes("constraint")) {
                    console.log("Constraint violation detected. Attempting to fix 'music' items with null icon...");
                    // We can't insert directly into 'sounds' if it fails. 
                    // We need to FIX data in 'sounds_old' or handle it during SELECT.

                    // Force a default icon for music
                    const safeSelect = `
                        id, owner_id, title, description, filename, media_type, 
                        access_level, category, mood, genre_primary, is_restricted, 
                        play_count, like_count, created_at, updated_at, deleted_at,
                        ${hasDuration ? 'duration_seconds' : '0'},
                        CASE 
                            WHEN category = 'music' AND (${hasIcon ? 'icon' : 'NULL'} IS NULL) 
                            THEN '/immagini/usericon.png' 
                            ELSE ${hasIcon ? 'icon' : 'NULL'} 
                        END as icon
                    `;

                    const safeInsert = `
                     INSERT INTO sounds (
                       id, owner_id, title, description, filename, media_type, 
                       access_level, category, mood, genre_primary, is_restricted, 
                       play_count, like_count, created_at, updated_at, deleted_at,
                       duration_seconds, icon
                     )
                     SELECT ${safeSelect} FROM sounds_old
                   `;

                    db.run(safeInsert, (err2) => {
                        if (err2) {
                            console.error("Retry failed:", err2);
                        } else {
                            console.log("Data migration with fix successful.");
                            finishMigration();
                        }
                    });
                }
            } else {
                console.log(`Copied ${this.changes} rows.`);
                finishMigration();
            }
        });
    });

    function finishMigration() {
        // 7. Drop old table
        db.run("DROP TABLE sounds_old", (err) => {
            if (!err) console.log("Dropped old 'sounds' table.");
        });

        // 8. Restore FK
        db.run("PRAGMA foreign_keys = ON");

        console.log("Migration V4 Completed Successfully.");
    }
});
