const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "website-login",
    password: "",
    port: 3306
});

connection.connect();
module.exports = connection;