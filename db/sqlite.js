const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Definizione del percorso del file database SQLite
const dbFile = path.join(__dirname, '..', 'database.sqlite');

// Connessione al database (se il file non esiste, viene creato vuoto)
const db = new sqlite3.Database(dbFile);

// Percorso del file SQL per l'inizializzazione dello schema (tabelle e struttura)
const initSqlPath = path.join(__dirname, '..', 'migrations', 'init-v3.sql');
const initSql = fs.readFileSync(initSqlPath, 'utf-8');

// Esecuzione dello script SQL per creare le tabelle se non sono già presenti
db.exec(initSql, (err) => {
  if (err) {
    console.error("Errore durante l'inizializzazione del database:", err);
  } else {
    // Log commentato per pulizia console, scommentare per debug
    // console.log("Database inizializzato correttamente (Schema V3).");
  }
});

/**
 * Esegue un comando SQL che non restituisce dati (es. INSERT, UPDATE, DELETE).
 * Restituisce una Promise che si risolve con il contesto di esecuzione (es. this.lastID).
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contiene info come l'ID dell'ultimo record inserito o le righe modificate
    });
  });
}

/**
 * Esegue una query SQL e restituisce la PRIMA riga trovata (es. SELECT per ID).
 * Utile per cercare un singolo record.
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Esegue una query SQL e restituisce TUTTE le righe trovate.
 * Utile per liste ed elenchi.
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Esporta l'oggetto database e le funzioni helper (Promise-based)
module.exports = { db, run, get, all };
