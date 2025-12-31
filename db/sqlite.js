// db/sqlite.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbFile);
const fs = require('fs');

const initSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init-v3.sql'), 'utf-8');

db.exec(initSql, (err) => {
  if (err) {
    console.error("Database initialization failed:", err);
  } else {
    console.log("Database initialized with V3 Schema.");
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };
