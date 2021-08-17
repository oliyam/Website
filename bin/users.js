const jwt = require("jsonwebtoken");

module.exports = {
    validateRegister: (req, res, next) => {
        if(!req.body.username || req.body.userrname.length <3)
            return res.status(400).send({message: "Please enter a username with at least 3 characters."});
    
        if(!req.body.password || req.body.password.length <8)
            return res.status(400).send({message: "Please enter a username with at least 8 characters."});
        
        if(!req.body.email || !req.body.email.matches(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
            return res.status(400).send({message: "Please enter a valid email address."});
        next();
    },
    
};