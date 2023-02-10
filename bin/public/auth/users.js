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

    isLoggedIn: (req, res) => {
          const token = req.headers.cookie.split(';').filter(option => option.startsWith("token="))[0].substring(6);
          console.log(token)
          if(token){
            try{
              var payload = jwt.verify(token,process.env.SECRETKEY)
            }
            catch (err){
               console.log(err)
            }
          }
          if(payload)
              return payload.username;
          else
              return false;
      }
};