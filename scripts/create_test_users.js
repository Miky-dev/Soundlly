// scripts/create_test_users.js
const UserModel = require('../models/UserModel');

(async () => {
  await UserModel.createTableIfNotExists();
  try {
    await UserModel.create('utente_test', 'password123', 'user');
    await UserModel.create('creatore', 'password123', 'creator');
    await UserModel.create('admin', 'password123', 'admin'); // <--- AGGIUNTO
    console.log('Utenti creati:');
    console.log('utente_test / password123');
    console.log('creatore / password123');
    console.log('admin / password123');  // <--- AGGIUNTO
  } catch(err) {
    console.error('Errore creazione utenti (forse già esistono):', err.message);
  }
  process.exit(0);
})();
