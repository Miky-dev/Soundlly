const { all } = require('./db/sqlite');
const fs = require('fs');

async function listUsers() {
    try {
        const users = await all('SELECT id, username, password_hash, role FROM users');
        let output = '--- Utenti Registrati ---\n';
        users.forEach(u => {
            output += `ID: ${u.id} | Username: ${u.username} | Role: ${u.role} | Hash: ${u.password_hash}\n`;
        });
        output += '-------------------------\n';
        fs.writeFileSync('users_output.txt', output);
        console.log('Output written to users_output.txt');
    } catch (err) {
        console.error('Errore:', err);
    }
}

setTimeout(listUsers, 1000);
