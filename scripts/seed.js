const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  console.log('Seeding database...');

  try {
    // 1. Create Admin User
    const adminPass = await hashPassword('admin123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@example.com', adminPass, 'admin', 'premium', 'Admin User', 'System Administrator']);
    console.log('Admin user created (admin / admin123)');

    // 2. Create Standard User
    const userPass = await hashPassword('user123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['mario', 'mario@example.com', userPass, 'user', 'standard', 'Mario Rossi', 'Just a music lover']);
    console.log('Standard user created (mario / user123)');

    // 3. Create Creator User
    const creatorPass = await hashPassword('creator123');
    await run(`
      INSERT INTO users (username, email, password_hash, role, plan, display_name, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['luigi', 'luigi@example.com', creatorPass, 'creator', 'premium', 'Luigi Verdi', 'Indie Artist']);
    console.log('Creator user created (luigi / creator123)');

    console.log('Seeding complete!');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('Users already exist, skipping creation.');
    } else {
      console.error('Error seeding database:', err);
    }
  } finally {
    db.close();
  }
}

seed();
