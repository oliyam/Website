const mysql = require('mysql');
const log = require('./public/logger/color-logger.js').log;

const PORT = process.env.DB_PORT;

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "website-login",
    password: "",
    port: PORT
});

connection.connect();
log("MySQL Database connection established: "+PORT)

module.exports = connection;