const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Percorsi per il database e il file di dump SQL
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const initSqlPath = path.join(__dirname, '..', 'dump.sql');

/**
 * Inizializza il database caricando lo schema e i dati dal file dump.sql
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Inizializzazione del database tramite dump.sql...');

        // Se il file del database esiste già, lo rimuoviamo per partire da uno stato pulito
        if (fs.existsSync(dbPath)) {
            console.log('Rimozione del database esistente...');
            fs.unlinkSync(dbPath);
        }

        const db = new sqlite3.Database(dbPath);

        // Lettura del file SQL
        try {
            const sql = fs.readFileSync(initSqlPath, 'utf8');

            // Esecuzione di tutti i comandi SQL nel dump
            db.exec(sql, (err) => {
                if (err) {
                    console.error('Errore durante l\'esecuzione di dump.sql:', err);
                    reject(err);
                } else {
                    console.log('Database inizializzato correttamente.');
                    db.close(resolve);
                }
            });
        } catch (readErr) {
            console.error('Impossibile leggere il file dump.sql:', readErr);
            reject(readErr);
        }
    });
}

/**
 * Funzione principale per il setup del progetto
 */
async function main() {
    try {
        console.log('--- INIZIO INIZIALIZZAZIONE PROGETTO ---');

        // Caricamento dei dati iniziali
        await initDatabase();

        console.log('--- INIZIALIZZAZIONE COMPLETATA ---');
        console.log('Ora puoi avviare il server usando "npm start".');
    } catch (err) {
        console.error('Inizializzazione fallita:', err);
        process.exit(1);
    }
}

// Avvio dello script
main();
