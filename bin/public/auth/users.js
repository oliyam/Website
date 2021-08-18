const jwt = require("jsonwebtoken");

module.exports = {
    validateRegister: (req, res, next) => {
        if(!req.body.username || req.body.username.length <3)
            return res.status(400).send({message: "Please enter a username with at least 3 characters."});
    
        if(!req.body.password || req.body.password.length <8)
            return res.status(400).send({message: "Please enter a password with at least 8 characters."});
        
        if(!req.body.email || !req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
            return res.status(400).send({message: "Please enter a valid email address."});
        next();
    },

    isLoggedIn: (req, res, next) => {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(
            token,
            process.env.SECRETKEY
          );
          req.userData = decoded;
          next();
        } catch (err) {
          return res.status(401).send({
            message: 'Your session is not valid!'
          });
        }
      }
};