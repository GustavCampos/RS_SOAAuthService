module.exports = {
    express: {
        appPort: 3000
    },
    bcrypt: {
        saltRounds: 10
    },
    sqlite: {
        path: "user.db",
        queries: {
            getUsers: `SELECT * FROM users WHERE username = ?;`
        }
    }
}