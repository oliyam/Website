const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    databse: "website-login",
    password: "1589"
});

connection.connect();
module.exports = connection;