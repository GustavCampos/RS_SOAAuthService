const bcrypt      = require("bcrypt");
const express     = require("express");
const fileSystem  = require("fs"); 
const jwt         = require("jsonwebtoken");
const sqlite      = require("sqlite3").verbose();

// Local Files
const c           = require("./constants.js")
const tokenSecret = require("./token_secret.json");

// Express constants
const app = express();
app.use(express.json()); // Set all request body to json

const appPort = c.express.appPort;

// Encription constants
const saltRounds = c.bcrypt.saltRounds;

// SQLite constants
const dbPath = c.sqlite.path;
const getUserQuery = c.sqlite.queries.getUsers;

// JWT constants
const tokenPath = "token_secret.json"
const tokenTimeLimit = 300; // 5min

// Functions
const returnError = (error, res, statusCode = 400) => {
    console.error(error.message);

    res.status(statusCode).json({
        status: "error",
        msg: error.message
    });

    return false;
};

const createDBConnection = (dbFile) => {
    return new sqlite.Database(dbFile, (error) => {
        if (error) {
            return console.error(error.message);
        }

        console.info(`Connected to ${dbFile}!`)
    })
};



const verifyToken = async (res, token) => {
    if (!tokenSecret?.secret) {
        return returnError({message: "Problem acessing server secrets"}, res, 500);
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, tokenSecret.secret, (error, decoded) => {
            if (error) {return returnError(error, res, 401);};

            resolve(decoded);
        });
    });
}

const verifyAdmin = async (res, token) => {
    const userInfo = await verifyToken(res, token);

    console.log(userInfo);

    if (!userInfo.isAdmin) {
        console.log("User not admin")

        return returnError(
            {message: "User has no admin privileges to perform task"},
            res, 403
        );
    }

    return userInfo;
}

// Welcome request ____________________________________________________________
app.get('/', (req, res) => {
    const response = {
        msg: "Welcome to auth API!",
        documentation: "https://github.com/gustavcampos/RS_SOAAuthService"
    }

    res.json(response);
});

// Admin requests _____________________________________________________________
app.get('/admin/user-list', async (req, res) => {
    const userInfo = await verifyAdmin(res, req.body.token);
    if (!userInfo) return;


    console.info("Retrieving user list.")
    
    const database = createDBConnection(dbPath);
    const databaseQuery = `SELECT username, isadmin, isactive FROM users`;

    database.all(databaseQuery, (error, rows) => {
        if (error) {returnError(error, res, 500);};

        res.json({
            status: "success",
            users: rows
        });

        database.close();
    });
})

app.post('/admin/add-user', async (req, res) => {
    const userInfo = await verifyAdmin(res, req.body.token);
    if (!userInfo) return;

    const username = req.body.username;
    const password = req.body.password;
    const isadmin  = req.body?.isadmin || false;

    console.info(`Trying to create user ${username}...`);

    const database = createDBConnection(dbPath);
    const databaseQuery = `
        INSERT INTO users (username, password, isactive, isadmin)
        VALUES (?, ?, true, ?);
    `;

    bcrypt.genSalt(saltRounds, (error, salt) => {
        if (error) {return returnError(error, res);}
        
        console.info("Password salt generated.");

        bcrypt.hash(password, salt, (error, hash) => {
            if (error) {return returnError(error, res);}

            console.info("Password hash generated.")

            database.run(databaseQuery, [username, hash, isadmin], (error) => {
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
 
app.post('/admin/toggle-user-status', async (req, res) => {
    const userInfo = await verifyAdmin(res, req.body.token);
    if (!userInfo) return;

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

app.post('/admin/toggle-user-admin', async (req, res) => {
    const userInfo = await verifyAdmin(res, req.body.token);
    if (!userInfo) return;

    const username = req.body.username;

    console.info(`Trying to change active status of user ${username}`);
    
    const database = createDBConnection(dbPath);
    const databaseQuery = `
        UPDATE users 
        SET isadmin = ? 
        WHERE username = ?; 
    `;

    database.get(getUserQuery, [username], (error, row) => {
        if (error) {return returnError(error, res);}
        if (!row) {return returnError({message: `User ${username} not found on database.`}, res)}

        console.info(`User ${username} retrieved.`)

        database.run(databaseQuery, [!row.isadmin, username], (error) => {
            if (error) {return returnError(error, res);}

            const msg = `User ${username} admin set to ${!row.isadmin}.`
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
                    isActive: row.isactive,
                    isAdmin: row.isadmin
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

app.get("/validate", async (req, res) => {
    const token = req.body.token;
    const decoded = await verifyToken(res, token);

    if (!decoded) {return;}

    res.json({
        status: "success",
        user: decoded.username,
        isadmin: decoded.isAdmin,
        token: token
    });
});

// Running API
app.listen(appPort, () => {
    console.info(`Server is running on http://localhost:${appPort}`);
});