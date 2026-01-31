const bcrypt = require('bcrypt');
const { db, run, get } = require('../db/sqlite');
const UserModel = require('../models/UserModel');

async function setAdminUser() {
    try {
        const username = 'admin';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Checking for user '${username}'...`);
        const existingUser = await UserModel.findByUsername(username);

        if (existingUser) {
            console.log(`User '${username}' found. Updating password and role...`);
            await run(
                `UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?`,
                [hashedPassword, existingUser.id]
            );
            console.log(`User '${username}' updated successfully.`);
        } else {
            console.log(`User '${username}' not found. Creating...`);
            await UserModel.create(username, password, 'admin');
            console.log(`User '${username}' created successfully.`);
        }

    } catch (error) {
        console.error('Error setting admin user:', error);
    } finally {
        // Close the database connection to exit the process
        // db.close() might be needed depending on the sqlite wrapper
        // The previous script used db.close(), so we should too if it's exposed, 
        // but 'db' object usually has .close() in sqlite3.
        if (db && typeof db.close === 'function') {
            db.close((err) => {
                if (err) console.error(err.message);
                console.log('Database connection closed.');
            });
        }
    }
}

setAdminUser();
