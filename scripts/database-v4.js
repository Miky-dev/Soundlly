const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const backupPath = path.join(__dirname, '..', 'database.sqlite.bak-v4');

console.log('--- INIZIO MIGRAZIONE DATABASE (V4) ---');

// 1. Creazione Backup di sicurezza
if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Backup creato in: ${backupPath}`);
} else {
    console.error('File del database non trovato! Impossibile procedere.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 2. Disabilita temporaneamente i vincoli di integrità (Foreign Keys)
    db.run("PRAGMA foreign_keys = OFF");

    // 3. Rinomina la vecchia tabella 'sounds' per backup interno
    console.log("Ridenominazione della vecchia tabella 'sounds'...");
    db.run("ALTER TABLE sounds RENAME TO sounds_old", (err) => {
        if (err) {
            console.error("Errore durante la ridenominazione della tabella:", err);
            return;
        }
    });

    // 4. Creazione della nuova tabella 'sounds' con colonna ICON e vincoli aggiornati
    console.log("Creazione della nuova tabella 'sounds'...");
    db.run(`
        CREATE TABLE IF NOT EXISTS sounds (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id          INTEGER NOT NULL,
        
          -- Info contenuto
          title             TEXT NOT NULL,
          description       TEXT,
          filename          TEXT NOT NULL,
          media_type        TEXT NOT NULL DEFAULT 'audio',
          duration_seconds  INTEGER DEFAULT 0,
        
          -- Classificazione
          mood              TEXT,
          genre_primary     TEXT,
        
          -- Controllo Accesso
          access_level      TEXT NOT NULL DEFAULT 'public' CHECK (
              access_level IN ('public', 'registered', 'premium', 'private')
          ),
          category          TEXT DEFAULT 'ambient' CHECK (
              category IN ('ambient', 'music')
          ),
          
          -- Nuova colonna per Icona/Copertina
          icon              TEXT, 
          is_restricted     INTEGER NOT NULL DEFAULT 0 CHECK (is_restricted IN (0, 1)),
        
          -- Statistiche
          play_count        INTEGER DEFAULT 0, 
          like_count        INTEGER DEFAULT 0,
        
          -- Metadati temporali
          created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at        DATETIME,
          
          FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
          
          -- VINCOLO: Se la categoria è 'music', l'icona deve essere obbligatoria
          CONSTRAINT check_music_has_cover CHECK (
             category != 'music' OR icon IS NOT NULL
          )
        );
    `, (err) => {
        if (err) {
            console.error("Errore nella creazione della nuova tabella:", err);
            process.exit(1);
        }
    });

    // 5. Ricreazione degli indici per le performance
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_owner ON sounds (owner_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_access ON sounds (access_level)");
    db.run("CREATE INDEX IF NOT EXISTS idx_sounds_created ON sounds (created_at DESC)");

    // 6. Migrazione dei dati
    console.log("Copia dei dati dalla vecchia tabella alla nuova...");

    db.all("PRAGMA table_info(sounds_old)", (err, columns) => {
        if (err) {
            console.error("Errore nel recupero dello schema originale:", err);
            return;
        }

        const colNames = columns.map(c => c.name);
        const hasIcon = colNames.includes('icon');
        const hasDuration = colNames.includes('duration_seconds');

        // Selezione dinamica delle colonne per gestire vecchi schemi
        let selectCols = `
           id, owner_id, title, description, filename, media_type, 
           access_level, category, mood, genre_primary, is_restricted, 
           play_count, like_count, created_at, updated_at, deleted_at
       `;

        selectCols += hasDuration ? ", duration_seconds" : ", 0 as duration_seconds";
        selectCols += hasIcon ? ", icon" : ", NULL as icon";

        const insertSql = `
         INSERT INTO sounds (
           id, owner_id, title, description, filename, media_type, 
           access_level, category, mood, genre_primary, is_restricted, 
           play_count, like_count, created_at, updated_at, deleted_at,
           duration_seconds, icon
         )
         SELECT ${selectCols} FROM sounds_old
       `;

        db.run(insertSql, function (err) {
            if (err) {
                // Gestione specifica per errore vincolo (musica senza icona)
                if (err.message.includes("constraint")) {
                    console.log("Violazione vincolo rilevata: correzione automatica per brani senza icona...");

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
                            console.error("Errore nel tentativo di migrazione con recupero:", err2);
                        } else {
                            console.log("Migrazione dati completata con correzione automatica.");
                            finishMigration();
                        }
                    });
                } else {
                    console.error("Errore critico durante la migrazione dati:", err);
                }
            } else {
                console.log(`Migrazione completata: ${this.changes} righe copiate.`);
                finishMigration();
            }
        });
    });

    function finishMigration() {
        // 7. Pulizia: Eliminazione vecchia tabella
        db.run("DROP TABLE sounds_old", (err) => {
            if (!err) console.log("Vecchia tabella 'sounds' rimossa.");
        });

        // 8. Ripristino vincoli di integrità
        db.run("PRAGMA foreign_keys = ON");

        console.log("--- MIGRAZIONE V4 COMPLETATA CON SUCCESSO ---");
    }
});
