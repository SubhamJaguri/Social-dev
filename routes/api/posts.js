const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');


const multer = require('multer');

const { v4: uuidv4 } = require('uuid');
var filename = uuidv4(); // '110ec58a-a0f2-4ac4-8393-c866d813b8d1'

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads/posts');
    },
    filename: function(req,file,cb){
        cb(null,filename+ file.originalname);
    }
});

const upload = multer({storage: storage});


//@route POST api/posts
//@desc Create a post
//@access Private --> login Required
router.post('/',upload.single('file'),[ auth,
    check('text','Text/Content of post is required').not().isEmpty()
  ],async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const file = req.file;

    const { text } = req.body;
    try {
        var post = new Post();
        post.user = req.user.id;
        post.text = text;
        post.image = file.filename;
        await post.save();
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }
});

//@route GET api/posts
//@desc SEE all post
//@access Private --> login Required
router.get('/',auth,async (req,res)=>{
    try {
        var posts = await Post.find().sort({date: -1}).populate('user',['name','email','userImage']).populate('comments.user',['name','userImage']);
        res.json(posts);
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }
});

//@route GET api/posts/:id
//@desc SEE particular post
//@access Private --> login Required
router.get('/:id',auth,async (req,res)=>{
    try {
        var post = await Post.findById(req.params.id).populate('user',['name','email','userImage']).populate('comments.user',['name','userImage']);
        if(!post){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        return res.status(500).json('Server Error');
    }
});


//@route DELETE api/posts/:id
//@desc Delete  post By Id
//@access Private --> login Required
router.delete('/:id',auth,async (req,res)=>{
    try {
        var post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({msg:'Post Not Found'});
        }
        if(post.user != req.user.id){
            return res.status(401).json({msg:'You are not Authorized'});
        }
        await post.remove();
        res.json({msg:"Post deleted successfully"});
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        return res.status(500).json('Server Error');
    }
});



//@route PUT api/posts/like/:id
//@desc like a particular post
//@access Private --> login Required
router.put('/like/:id',auth,async (req,res)=>{
    try {
        var post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        //Get like User_Id
        if(post.likes.length > 0){
        post.likes.map(like => {
            if(like.user == req.user.id){
                const removeIndex = like._id;
                post.likes.splice(removeIndex,1);
            }else{
                    post.likes.unshift({user:req.user.id});
                }
        })}else{
            post.likes.unshift({user:req.user.id});
        }
        await post.save();
        res.json(post.likes);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        return res.status(500).json('Server Error');
    }
});


//@route POST api/posts/comment/:id
//@desc Create a comment on post
//@access Private --> login Required
router.post('/comment/:id',[ auth,
    check('text','Text/Content of comment is required').not().isEmpty()
  ],async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { text} = req.body;
    try {
        var post = await Post.findById(req.params.id);
        post.comments.unshift({user:req.user.id,text:text});
        await post.save();
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).json('Server Error');
    }
});


//@route DELETE api/posts/comment/:id/:comment_id
//@desc Delete  comment inside post By Id
//@access Private --> login Required
router.delete('/comment/:id/:comment_id',auth,async (req,res)=>{
    try {
        var post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({msg:'Post Not Found'});
        }
        //Pull Out comment
        const comment = post.comments.find(comment => comment.id == req.params.comment_id);  //This is equivalent to comment = where(comment.id == req.params.comment_id);
        //Check if exist
        if(!comment){
            return res.status(404).json({msg:'Comment Not Found'});
        }
        //Check user
        if(comment.user != req.user.id){
            return res.status(404).json({msg:'User Not Authorized'});
        }
        const removeIndex = comment._id;
        post.comments.splice(removeIndex,1);
        console.log("Comment has been removed");
        post.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(404).json({ msg:"Post not found"}); 
        }
        return res.status(500).json('Server Error');
    }
});


module.exports = router;