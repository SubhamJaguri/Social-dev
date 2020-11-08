const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');


//@route GET api/auth
//@desc Test route
//@access Public --> No login Required
router.get('/',auth,async (req,res)=>{
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({msg:"Server Error Occured"});
    }
});



//@route POST api/auth
//@desc Login user & send JWT Token Back
//@access Public --> No login Required
router.post('/', [
    check('email','Please Use the valid Email').isEmail(),
    check('password','Password is Required').exists()
  ], async (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {email ,password} = req.body;

    try{
    //Check if user exists
    let user = await User.findOne({email});

    if(!user){
        return res.status(400).json({ errors: [{msg: 'Invalid Credentials'}] });
    }
    
    //Validate the password with help of bcrypt.js
    var isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(400).json({ errors: [{msg: 'Invalid Credentials'}] });
    }

    //Return JSON web Token
    const payload = {
        user:{
            id: user.id
        }
    }

    jwt.sign(payload,config.get('jwtToken'),{ expiresIn: 3600},(err,token)=>{
        if(err) throw err;
        res.json({token});
    });
    }
    catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
    }
});


module.exports = router;