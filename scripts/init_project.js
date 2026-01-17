const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const initSqlPath = path.join(__dirname, '..', 'migrations', 'init-v3.sql');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing ${command}:`, error);
                reject(error);
                return;
            }
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            resolve();
        });
    });
}

function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Initializing database from init-v3.sql...');
        const db = new sqlite3.Database(dbPath);
        const sql = fs.readFileSync(initSqlPath, 'utf8');

        db.exec(sql, (err) => {
            if (err) {
                console.error('Error running init-v3.sql:', err);
                reject(err);
            } else {
                console.log('Base schema applied successfully.');
                db.close(resolve);
            }
        });
    });
}

async function main() {
    try {
        console.log('--- STARTING PROJECT INITIALIZATION ---');

        // 1. Apply Base Schema
        await initDatabase();

        // 2. Run Database V4 Migration (updates 'sounds' table)
        await runCommand('node scripts/database-v4.js');

        // 3. Seed Database (Creates users)
        await runCommand('node scripts/seed.js');

        console.log('--- INITIALIZATION COMPLETE ---');
        console.log('You can now run "npm start" to launch the server.');
    } catch (err) {
        console.error('Initialization failed:', err);
        process.exit(1);
    }
}

main();
