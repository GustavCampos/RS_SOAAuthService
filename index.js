const bcrypt     = require("bcrypt");
const express    = require("express");
const fileSystem = require("fs"); 
const jwt        = require("jsonwebtoken");
const sqlite     = require("sqlite3").verbose();

// Express constants
const app = express();
app.use(express.json()); // Set all request body to json

const appPort = 3000;

// Encription constants
const saltRounds = 10;

// SQLite constants
const dbPath = "users.db"
const getUserQuery = `SELECT * FROM users WHERE username = ?;`;

// JWT constants
const tokenPath = "token_secret.json"
const tokenTimeLimit = 300; // 5min

// Functions
const returnError = (error, res, statusCode = 400) => {
    console.error(error.message);

    return res.status(statusCode).json({
        status: "error",
        msg: error.message
    });
};

const createDBConnection = (dbFile) => {
    return new sqlite.Database(dbFile, (error) => {
        if (error) {
            return console.error(error.message);
        }

        console.info(`Connected to ${dbFile}!`)
    })
};

// Welcome request ____________________________________________________________
app.get('/', (req, res) => {
    const response = {
        msg: "Welcome to auth API!",
        requisition: req.body
    }

    res.json(response);
});

// Admin requests _____________________________________________________________
app.post('/admin/add-user', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.info(`Trying to create user ${username}...`);

    const database = createDBConnection(dbPath);
    const databaseQuery = `
        INSERT INTO users (username, password, isActive)
        VALUES (?, ?, true);
    `;

    bcrypt.genSalt(saltRounds, (error, salt) => {
        if (error) {return returnError(error, res);}
        
        console.info("Password salt generated.");

        bcrypt.hash(password, salt, (error, hash) => {
            if (error) {return returnError(error, res);}

            console.info("Password hash generated.")

            database.run(databaseQuery, [username, hash], (error) => {
                if (error) {return returnError(error, res);}

                const msg = `User ${username} created!`;
                console.info(msg);

                res.json({
                    status: "success",
                    msg: msg
                }); 
               
                database.close();
            });
        });
    })
});
 
app.post('/admin/toggle-user-status', (req, res) => {
    const username = req.body.username;

    console.info(`Trying to change active status of user ${username}`);
    
    const database = createDBConnection(dbPath);
    const databaseQuery = `
        UPDATE users 
        SET isactive = ? 
        WHERE username = ?; 
    `;

    database.get(getUserQuery, [username], (error, row) => {
        if (error) {return returnError(error, res);}
        if (!row) {return returnError({message: `User ${username} not found on database.`}, res)}

        console.info(`User ${username} retrieved.`)

        database.run(databaseQuery, [!row.isactive, username], (error) => {
            if (error) {return returnError(error, res);}

            const msg = `User ${username} status set to ${!row.isactive}.`
            console.info(msg);

            res.json({
                status: "success",
                msg: msg
            });

            database.close();
        });
    });
});

// Auth requests ______________________________________________________________
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const database = createDBConnection(dbPath);

    database.get(getUserQuery, [username], (error, row) => {
        if (error) {return returnError(error, res);}
        if (!(row?.isactive ?? false)) {return returnError({message: `User ${username} not found on database.`}, res)}

        console.info(`User ${username} retrieved.`)

        bcrypt.compare(password, row.password, (error, isValid) => {
            if (error) {return returnError(error, res);}
            if (!isValid) {return returnError({message: "Password sent is not valid"}, res, 401)}

            console.info("Valid credentials sent.")

            fileSystem.readFile(tokenPath, "utf-8", (error, data) => {
                console.info("Retrieving token secret.")

                if (error) {returnError(error, res, 500)}
                
                const payload = {
                    userID: row.id,
                    username: row.username,
                    isActive: row.isactive
                };
                
                const secret = JSON.parse(data).secret;
                const options = {expiresIn: req.body.expiration ?? tokenTimeLimit};

                jwt.sign(payload, secret, options, (error, token) => {
                    if (error) {return returnError(error, res, 500);}

                    const decodedToken = jwt.decode(token);
                    const expirationDate = new Date(decodedToken.exp * 1000);

                    console.info("Autentication token created!")

                    res.json({
                        status: "success",
                        sessionToken: token,
                        expiresIn: expirationDate
                    });

                    database.close();
                });
            });
        });
    });
});

app.get("/validate/:token", (req, res) => {
    fileSystem.readFile(tokenPath, "utf-8", (error, data) => {
        console.info("Retrieving token secret.")
        
        if (error) {returnError(error, res, 500)}
        
        const tokenSecret = JSON.parse(data).secret;

        jwt.verify(req.params.token, tokenSecret, (error, decoded) => {
            if (error) {return returnError(error, res, 401);};

            res.json({
                status: "success",
                user: decoded.username,
                token: req.params.token,
            });
        });
    })
});

// Running API
app.listen(appPort, () => {
    console.info(`Server is running on http://localhost:${appPort}`);
});