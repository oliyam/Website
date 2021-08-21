const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "website-login",
    password: "",
    port: process.env.DB_PORT
});

connection.connect();
module.exports = connection;