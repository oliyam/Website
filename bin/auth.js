const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("db");

router.post('/signup', (req, res, next) => {
    db.query(`SELECT id FROM users WHERE LOWER(username) = LOWER(${req.body.username})`, (err, rersult) => {
        log(result, "green")
    });
});