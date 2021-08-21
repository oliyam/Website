const mysql = require('mysql');
const log = require('../logger/color-logger.js').log;

const PORT = process.env.DB_PORT;
const HOST = process.env.DB_HOST;
const USER = process.env.DB_USER;
const PWD = process.env.DB_PWD;

const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    database: "website-login",
    password: PWD,
    port: PORT
});

connection.connect();
log("MySQL database connection established: ", "cyan")
log(USER+"@"+HOST+":"+PORT, "yellow")

module.exports = connection;