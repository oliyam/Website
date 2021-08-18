const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");

const db = require("./db");
const users = require('./users');

router.post('/signup', users.validateRegister, (req, res) => {
    db.query(`SELECT * FROM users WHERE username="${db.escape(req.body.username )}";`, (err, result) => {
        if (result.length) 
            return res.status(409).send({message: 'This username is already in use!'});
        else
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) 
                    return res.status(500).send({message: err});
                else 
                    db.query(`INSERT INTO users (id, username, password, email, registered) VALUES ("${uuid.v4()}", "${db.escape(req.body.username)}", "${db.escape(hash)}", "${db.escape(req.body.email)}", now())`,(err, result) => {
                        if (err)
                            return res.status(400).send({message: err });
                        return res.status(201).send({message: "Registered!"});
                    });
            });
    });
});

router.post('/login', (req, res) => {
	db.query(`SELECT * FROM users WHERE username="${db.escape(req.body.username)}";`, (err, result) => {
		if(err)
            return res.status(400).send({message: err});
        if(!result.length)
            return res.status(400).setDefaultEncoding({message: "Username or Password incorrect!"});
        
        bcrypt.compare(req.body.password, result[0]['password'], (bErr, bResult) => {
            if(bErr)
                return res.status(400).send({message: "Username or Password incorrect!"});
            if(bResult)
                var token = jwt.sign({
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
        return res.status(400).send({message: "Username or Password incorrect!"});
    });
});
 
module.exports = router;