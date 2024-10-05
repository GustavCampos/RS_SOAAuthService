// Setup database ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const sqlite = require("sqlite3").verbose();

// Connect to database
const database = new sqlite.Database('users.db', (error) => {
    if (error) {
        return console.error(error.message);
    }

    console.log("Connected to SQLite Database!")
})

// Create users table if it doesn't exist
database.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        isactive BOOLEAN NOT NULL
    )     
`, (error) => {
    if (error) {
        return console.error(error.message);
    }

    console.log("Users table created or already exist!")
});

const { error } = require("console");
// Setup token secret file ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const crypto     = require("crypto");
const fileSystem = require("fs");

const secret = crypto.randomBytes(64).toString("hex"); // 128-character random token secret

const data = JSON.stringify({secret: secret}, null, 4);
    
fileSystem.writeFile("token_secret.json", data, (error) => {
    if (error) {console.error(error)}

    console.log("File with secret for token created!")
});