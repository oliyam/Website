require('dotenv').config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid")

const db = require("db");

router.post('/signup', (req, res, next) => {
	db.query(`SELECT * From users where username="${req.body.username}";`, (err, result) => {
		if(err)
            return res.status(400).send({message: err});
        //if(!result.length)
	});
});

router.post('/login', (req, res, next) => {
	db.query(`SELECT * FROM users WHERE username="${db.escape(req.body.username)}";`, (err, result) => {
		if(err)
            return res.status(400).send({message: err});
        if(!result.length)
            return res.status(400).setDefaultEncoding({message: "Username or Password incorrect!"});
        
        bcrypt.compare(req.body.password, result[0]['password'], (bErr, bResult) => {
            if(bErr)
                return res.status(400).send({
                    message: "Username or Password incorrect!"
                });
            if(bResult)
                const token = jwt.sign({
                    username: result[0].username,
                    userId: result[0].userId
                    }, 
                    process.env.SECRETKEY, {expiresIn: "1d"}
                );
            db.query(`UPDATE users SET last_login=now() WHERE id="${result[0].id}";`);
            
            return res.status(200).send({
                message: "Logged in!",
                token,
                user: result[0]
            });
        });
        return res.status(400).send({
            message: "Username or Password incorrect!"
        });
    });
});
 