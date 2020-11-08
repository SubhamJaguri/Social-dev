const jwt = require('jsonwebtoken');
const config = require('config');


module.exports = (req,res,next) => {
    const token = req.header('x-auth-token');       //This is name of the token inside the req

    //Check if token exists
    if(!token){
        return res.status(401).json({msg:"No Token, Authorization Denied"});
    }

    //Verify Token
    try{
           const decoded =  jwt.verify(token,config.get('jwtToken'));  //This RHS part decode the token as just console log it to see...
           req.user = decoded.user;
           next();
    }
    catch(err){
        res.status(401).json({msg:'Token is not valid'});
    }
};