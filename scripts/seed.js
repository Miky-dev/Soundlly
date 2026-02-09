const bcrypt = require('bcrypt');
const { run, db } = require('../db/sqlite');

const SALT_ROUNDS = 10;

/**
 * Helper per generare l'hash delle password.
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Popola il database con alcuni utenti di prova iniziali.
 */
async function seed() {
  console.log('Inizio popolamento database (seed)...');

  try {
    // 1. Creazione Utente Amministratore
    const adminPass = await hashPassword('admin123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@example.com', adminPass, 'admin', 'premium', 'Amministratore', 'Gestore del sistema']);
    console.log('Creato utente Admin (admin / admin123)');

    // 2. Creazione Utente Standard
    const userPass = await hashPassword('user123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['mario', 'mario@example.com', userPass, 'user', 'standard', 'Mario Rossi', 'Appassionato di musica rilassante']);
    console.log('Creato utente Standard (mario / user123)');

    // 3. Creazione Utente Creatore
    const creatorPass = await hashPassword('creator123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['luigi', 'luigi@example.com', creatorPass, 'creator', 'premium', 'Luigi Verdi', 'Artista Indie']);
    console.log('Creato utente Creatore (luigi / creator123)');

    console.log('Popolamento completato con successo!');
  } catch (err) {
    // Gestione specifica per inserimenti duplicati
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('Gli utenti di test esistono già, inserimento saltato.');
    } else {
      console.error('Errore durante il popolamento del database:', err);
    }
  } finally {
    // Chiudiamo la connessione al database
    db.close();
  }
}

// Avvio dello script
seed();
