// models/UserModel.js
const bcrypt = require('bcrypt');
const { run, get, all } = require('../db/sqlite');

class UserModel {
  // Table creation is now handled by mutations/init-v3.sql loaded in db/sqlite.js

  static async create(username, plainPassword, role = 'user') {
    const hash = await bcrypt.hash(plainPassword, 10);
    // V3 Schema: password_hash instead of password
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
