const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    databse: "website-login",
    password: ""
});

connection.connect();
module.exports = connection;