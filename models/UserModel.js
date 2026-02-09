const bcrypt = require('bcrypt');
const { run, get, all } = require('../db/sqlite');

class UserModel {
  // La creazione della tabella è gestita dal file di migrazione 'migrations/init-v3.sql'
  // caricato automaticamente all'avvio in 'db/sqlite.js'

  static async create(username, plainPassword, role = 'user') {
    const hash = await bcrypt.hash(plainPassword, 10);
    // Nota: Schema V3 usa 'password_hash' invece di 'password'
    const res = await run(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`, [username, hash, role]);
    return { id: res.lastID, username, role };
  }

  static async findByUsername(username) {
    return await get(`SELECT * FROM users WHERE username = ?`, [username]);
  }

  static async findById(id) {
    return await get(`SELECT * FROM users WHERE id = ?`, [id]);
  }

  static async validatePassword(user, plainPassword) {
    if (!user || !user.password_hash) return false;
    return await bcrypt.compare(plainPassword, user.password_hash);
  }
}

module.exports = UserModel;
