const express = require('express');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

//@route GET api/profile
//@desc Profile Route that get profile of all users
//@access Public --> No login Required
router.get('/', async(req, res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','email','avatar','userImage']);
        res.json(profiles);
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


//@route GET api/profile/user/:user_id
//@desc Profile Route that get profile of specific user by user_id
//@access Public --> No login Required
router.get('/user/:user_id', async(req, res)=>{
    try {

        const profile = await Profile.findOne({user : req.params.user_id}).populate('user',['name','email','avatar','userImage']);
        if(!profile){
            return res.status(401).json({ msg: "No Profile found for this user"});
        }
        res.json(profile);
    } 
    catch(err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(401).json({ msg: "No Profile found for this user"}); 
        }
        return res.status(500).send('Server Error');
    }
});


//@route GET api/profile/me
//@desc Profile Route that get profile of current logged in user
//@access Private --> login Required
router.get('/me',auth, async(req, res)=>{
    try {
        const profile = await Profile.findOne({user : req.user.id}).populate('user',['name','email','avatar','userImage']);
        if(!profile){
            return res.status(401).json({ msg: "No Profile found for this user"});
        }
        res.json(profile);
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

//@route DELETE api/profile
//@desc Profile Route that delete profile of current logged in user & also delete user
//@access Private --> login Required
router.delete('/',auth, async(req, res)=>{
    try {
        await Profile.findOneAndRemove({user : req.user.id});

        await User.findOneAndRemove({_id : req.user.id});

        res.json({msg:"The user has been deleted successfully"});
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


//@route POST api/profile
//@desc Create or update user profile
//@access Private --> login Required

router.post('/',[auth, [
    check('status','Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
  ]],async (req,res) =>{   //In order to use 2 middle ware we can use [1st , 2nd]
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const {company, website ,location,bio,status,githubusername,skills,youtube,facebook,twitter,instagram,linkedin} = req.body;

    //Build profile object
     const profileFields = {};
     profileFields.user = req.user.id;
     if(company) profileFields.company = company;
     if(website) profileFields.website = website;
     if(location) profileFields.location = location; 
     if(bio) profileFields.bio = bio;
     if(status) profileFields.status = status;
     if(githubusername) profileFields.githubusername = githubusername;

     //Store array in the database
     if(skills){
         profileFields.skills = skills.split(',').map(skill => skill.trim());
     }

     //Build Social Object
     profileFields.social = {};

     if(youtube) profileFields.social.youtube = youtube;
     if(facebook) profileFields.social.facebook = facebook;
     if(twitter) profileFields.social.twitter = twitter;
     if(instagram) profileFields.social.instagram = instagram;
     if(linkedin) profileFields.social.linkedin = linkedin;


     //Update or Insert Data
    try {
        let profile = await Profile.findOne({user:req.user.id});

        if(profile){
            profile = await Profile.findOneAndUpdate({user:req.user.id},{$set: profileFields},{new:true});
            return res.json(profile);
        }
        profile = new Profile(profileFields);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }

});



//@route PUT api/profile/experience
//@desc Create or update user experience
//@access Private --> login Required

router.put('/experience',[auth, [
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From is required').not().isEmpty()
  ]],async (req,res) =>{   //In order to use 2 middle ware we can use [1st , 2nd]
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const {company, title ,location,from,to,current,description} = req.body;

    //Build profile object
     const newExp = {
         company,title,location,from,to,current,description
     };
     //Update or Insert Data
    try {
        let profile = await Profile.findOne({user:req.user.id});

        profile.experience.unshift(newExp);
        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }

});


//@route DELETE api/profile/experience/:exp_id
//@desc Profile Route that delete profile of current logged in user & also delete user
//@access Private --> login Required
router.delete('/experience/:exp_id',auth, async(req, res)=>{
    try {
        const profile = await Profile.findOne({user : req.user.id});

        //Get Remove INDEX
        profile.experience.map(item => {
            if(item._id == req.params.exp_id){
                const removeIndex = item._id;
                profile.experience.splice(removeIndex,1);
            }
        })
        await profile.save();
        res.json(profile);
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


//@route PUT api/profile/education
//@desc Create or update user education
//@access Private --> login Required

router.put('/education',[auth, [
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of Study is required').not().isEmpty(),
    check('from','From is required').not().isEmpty()
  ]],async (req,res) =>{   //In order to use 2 middle ware we can use [1st , 2nd]
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const {school, degree ,fieldofstudy,from,to,current,description} = req.body;

    //Build profile object
     const newEdu = {
        school, degree ,fieldofstudy,from,to,current,description
     };
     //Update or Insert Data
    try {
        let profile = await Profile.findOne({user:req.user.id});

        profile.education.unshift(newEdu);
        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }

});


//@route DELETE api/profile/education/:exp_id
//@desc Profile Route that delete education from profile of current logged in user & also delete user
//@access Private --> login Required
router.delete('/education/:edu_id',auth, async(req, res)=>{
    try {
        const profile = await Profile.findOne({user : req.user.id});

        //Get Remove INDEX
        profile.education.map(item => {
            if(item._id == req.params.edu_id){
                const removeIndex = item._id;
                profile.education.splice(removeIndex,1);
            }
        })
        await profile.save();
        res.json(profile);
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


//@route GET api/profile/github/:githubname
//@desc Profile Route that get profile of specific github by githubname
//@access Public --> No login Required
router.get('/github/:username', async(req, res)=>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,
            method: 'GET',
            headers: {'user-agent':'node.js'}
        };

        request(options,(err,response,body)=>{
            if(err) console.error(err);
            if(response.statusCode !== 200){
                return res.status(404).json({msg:'No Github Profile found'});
            }

            res.json(JSON.parse(body));
        });
    } 
    catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

module.exports = router;