// db/sqlite.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Definiamo il percorso del file del database "database.sqlite"
const dbFile = path.join(__dirname, '..', 'database.sqlite');

// Ci connettiamo al database (se non esiste, viene creato vuoto)
const db = new sqlite3.Database(dbFile);
const fs = require('fs');

// Leggiamo il file SQL di inizializzazione (lo schema delle tabelle)
const initSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init-v3.sql'), 'utf-8');

// Eseguiamo lo script SQL per creare le tabelle se non esistono
db.exec(initSql, (err) => {
  if (err) {
    console.error("Database initialization failed:", err);
  } else {
    console.log("Database initialized with V3 Schema.");
  }
});

// Funzione "run": Esegue comandi che NON restituiscono dati (es. INSERT, UPDATE, DELETE)
// Ritorna una Promise per poter usare "await" invece delle callback.
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // "this" contiene info come l'ID dell'ultimo record inserito
    });
  });
}

// Funzione "get": Esegue una query e restituisce SOLO LA PRIMA riga trovata (es. SELECT per ID)
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Funzione "all": Esegue una query e restituisce TUTTE le righe trovate (es. lista utenti)
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };
