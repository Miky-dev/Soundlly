const UserModel = require('../models/UserModel');

(async () => {
  try {
    // Creazione degli utenti con i rispettivi ruoli
    // La tabella 'users' deve essere già stata creata tramite le migrazioni

    // Utente base
    await UserModel.create('utente_test', 'password123', 'user');

    // Utente creatore (con permessi per caricare contenuti)
    await UserModel.create('creatore', 'password123', 'creator');

    // Utente amministratore (accesso completo)
    await UserModel.create('admin', 'password123', 'admin');

    console.log('--- Utenti di prova creati con successo ---');
    console.log('1. utente_test / password123 (Ruolo: user)');
    console.log('2. creatore / password123 (Ruolo: creator)');
    console.log('3. admin / password123 (Ruolo: admin)');

  } catch (err) {
    // Gestione errori: è probabile che gli utenti esistano già se lo script viene rilanciato
    console.error('Attenzione: Impossibile creare gli utenti (probabilmente esistono già).');
    console.error('Dettaglio errore:', err.message);
  }

  // Termina il processo con successo
  process.exit(0);
})();
