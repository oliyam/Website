const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");

const db = require("./db").connect("website-login");
const users = require('./users');
const log = require('../logger/color-logger.js').log;

router.post('/signup', (req, res) => {

    log(req.body.submit)

    switch(req.body.submit){

    case "register":
      if(users.validateRegister)
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
    break;

    case "login":
	    db.query(`SELECT * FROM users WHERE username="${db.escape(req.body.username)}";`, (err, result) => {
    		if(err)
                return res.status(400).send({message: err});
            if(!result.length)
               return res.status(400).send({message: "Username or Password incorrect!"});

               log(String(req.body.password))
            bcrypt.compare(String(req.body.password), '$2b$10$fezKWfj4KZz8EtZFiO5dYe8eonoPS13LqzD4V2y4/cWYTi8Nne6A.', (bErr, bResult) => {
                log(bResult)
                if(bErr)
                     return res.status(400).send({message: "Username or Password incorrect!"});
                if(bResult){
                const token = jwt.sign({
                            username: result[0].username,
                            userId: result[0].userId
                        }, 
                        process.env.SECRETKEY, { expiresIn: "1d"
                        }
                    );
                    log(token)
                //db.query(`UPDATE users SET last_login=now() WHERE id="${result[0].id}";`);
                res.cookie("token", token)
                return res.status(200).send({
                    message: "Logged in!",
                    token: token,
                    user: result[0]
                });
                }
                else
                    return res.status(400).send({message: "Username or Password incorrect!"});
            });
        });
    break;

    case "check":
        if(users.isLoggedIn(req))
            return res.status(200).send({message: "User logged in!"});
        else
            return res.status(400).send({message: "User not logged in!"});
    break;
    }
});
 
module.exports = router;