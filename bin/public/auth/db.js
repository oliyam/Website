const mysql = require('mysql');
const dotenv = require('dotenv').config();
const log = require('../logger/color-logger.js').log;

const PORT = process.env.DB_PORT;
const HOST = process.env.DB_HOST;
const USER = process.env.DB_USER;
const PWD = process.env.DB_PWD;

exports.connect = (database) =>{

    const connection = mysql.createConnection({
        host: HOST,
        user: USER,
        database: database,
        password: PWD,
        port: PORT
    });

    connection.connect(function(err) {
        if (err)
            return log('MySQL database error: ' + err.message, "red");
      
        log("MySQL database connection established: ", "cyan");
        log(USER+"@"+HOST+":"+PORT, "yellow");
        return connection;
    });
}