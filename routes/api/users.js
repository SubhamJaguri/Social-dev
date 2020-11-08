

const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const config = require('config');
const jwt = require('jsonwebtoken');
//Bring USER model

const User = require('../../models/User');

const multer = require('multer');

const { v4: uuidv4 } = require('uuid');
var filename = uuidv4(); // '110ec58a-a0f2-4ac4-8393-c866d813b8d1'

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads/users');
    },
    filename: function(req,file,cb){
        cb(null,filename+ file.originalname);
    }
});

const upload = multer({storage: storage});

// const upload = multer({storage: storage,limits:{
//     fileSize: 1024 * 1024 * 5       //5mb
// }});

// const fileFilter = (req,file,cb) => {
//     if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
//         cb(null,true);
//     }else{
//         cb(null,false);
//     }
// }

//@route POST api/users
//@desc Register user
//@access Public --> No login Required
router.post('/', upload.single('file'),[
    check('name','Name is required').not().isEmpty(),
    check('email','Please Use the valid Email').isEmail(),
    check('password','Password must be of minimum 5 character').isLength({ min: 5 })
  ], async (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

const file = req.file;
const {name, email ,password} = req.body;


try{
    //Check if user exists
    let user = await User.findOne({email});

    if(user){
        return res.status(400).json({ errors: [{msg: 'User with this email already Exists'}] });
    }
    //Get user Gravatar
    const avatar = gravatar.url(email,{
        s:'200',
        r:'pg',
        d:'mm'
    });

    user = new User({
        name,
        email,
        avatar,
        password,
        userImage: file.filename
    });
    //Encrypt Password
    const salt = await bcrypt.genSalt(10);
    var encrypted_password = await bcrypt.hash(password,salt);
    user.password = encrypted_password;

    await user.save();

    //Return JSON web Token
    const payload = {
        user:{
            id: user.id
        }
    }

    jwt.sign(payload,config.get('jwtToken'),{ expiresIn: 3600},(err,token)=>{
        if(err) throw err;
        res.json({token,user});
    });
}
catch(err){
    console.error(err.message);
    return res.status(500).send('Server Error');
}


});

module.exports = router;