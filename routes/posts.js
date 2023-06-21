const Post=require("../models/posts");
const express=require("express");
const router=express.Router();
const authRequired= require("../middleware/authUtils");


const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary =require("cloudinary").v2;
const streamifier = require('streamifier');

cloudinary.config({ 
    cloud_name: 'durr83iqg', 
    api_key: '993891134356919', 
    api_secret: 'T7UnmkIbU31Oqk_vWUoQtvYinWc' 
  });

router.post("/user/post",authRequired,upload.single('post-image'),async(req,res)=>{
    try{
        let postImage=null;
        let uploadResult;
        if(req.file){
            uploadResult = await new Promise((resolve, reject) =>{
                const stream =  cloudinary.uploader.upload_stream(async (error, result) => {
                    if (error) {
                      reject(error)
                    }
                    else{
                      resolve(result)
                    }
                })
                streamifier.createReadStream(req.file.buffer).pipe(stream);
             })

             postImage=uploadResult.secure_url
        }

   

        const post=await Post.create({
            content:req.body.content,
            postImage:postImage,
            user:req.user.id
        })
        return res.json({success:true,post:post});
    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });
    }

    
})


router.get("/posts",authRequired,async(req,res)=>{
    try{
        const posts=await Post.find().populate('user');
        return res.json({success:true,posts:posts});
    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });

    }
})

//getAll post of a particular user

router.get("/posts/user/:userid",authRequired,async(req,res)=>{
    const userId=req.params.userid
    try{
        const posts=await Post.find({user:userId});

        return res.json({success:true,posts})


    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });

    }
})


//editPost....

router.post("/posts/edit/:postId",upload.single('post-image'),authRequired,async(req,res)=>{
    const postId=req.params.postId;
    try{
        const post=await Post.findOne({_id:postId,user:req.user.id});
        if(!post){
            return res.status(400).json({success:false,mag:"Post not Found"});
        }
        if(req.file){
            post.postImage=req.file.path
        }
        if(req.body?.content){
            post.content=req.body.content;
        }
        await post.save();
        return res.json({success:true,post})

    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });
    }
})

//delete the post

router.delete("/posts/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const post=await Post.findOne({_id:postId,user:userId});
        if(!post){
            return res.json({success:false,msg:"post not found"});
        }
        const deletedPost= await Post.findByIdAndDelete(req.params.postId);

        return res.json({success:true,post:deletedPost})

    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });
    }
})


//likes Api Routes

router.post("/posts/like/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const post=await Post.findById(postId).populate('user');
        if(!post){
            return res.setMaxListeners(404).json({success:false,msg:"post not Found"});
        }
        if(post.likes.likedBy.some((id)=>id.toString()===userId.toString())){
            return res.status(400).json({success:false,msg:"already liked"});
        }
        post.likes.dislikedBy=post.likes.dislikedBy.filter((id)=>id.toString()!==userId.toString());
        post.likes.likeCount+=1;
        post.likes.likedBy.push(userId);
        post.updatedAt=Date.now();
        await post.save();
        return res.json({success:true,post});
    }
    catch(err){
    
        return res.status(400).json({ success:false, msg: err.message });
    }
})

router.post("/posts/dislike/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const post=await Post.findById(postId);
        if(!post){
            return res.setMaxListeners(404).json({success:false,msg:"post not Found"});
        }
        if(post.likes.dislikedBy.some((id)=>id===userId)){
            return res.status(400).json({success:false,msg:"already disliked"});
        }
        post.likes.likedBy=post.likes.likedBy.filter((id)=>id.toString()!==userId.toString());
        post.likes.likeCount-=1;
        post.likes.dislikedBy.push(userId);
        post.updatedAt=Date.now();
        await post.save();
        return res.json({success:true,post});
    }
    catch(err){
    
        return res.status(400).json({ success:false, msg: err.message });
    }
})


//get particuar post details;

router.get("/posts/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    try{
        const post=await Post.findOne({_id:postId}).populate('likes.likedBy').populate('likes.dislikedBy');
        return res.json(({success:true,post}));

    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });
    }
})

//routes to add comments;

router.post("/posts/comment/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const comment={
            content:req.body.content,
            user:req.user.id
        }
        const post=await Post.findByIdAndUpdate(postId,{$push:{comments:comment}},{new:true});
        if(!post){
            res.status(404).json({success:false,msg:"No post Found"});
        }
        return res.json({success:true,post})
    }
    catch(err){
        return res.status(400).json({ success:false, msg: err.message });
    }

})


// //chat gpts code

// // Define the API endpoint to add a reply to a comment or a reply
// router.post('/posts/:postId/comments/:commentId/replies',authRequired, async(req, res) => {
//     const postId = req.params.postId;
//     const commentId = req.params.commentId;
//     const user=req.user.id;
//     const { content } = req.body;
  
//     // Create a new reply based on the request data
//     const reply = {
//       content,
//       user,
//       replies: []
//     };
  
//     // Recursive function to find the comment or reply by its ID within the comments array
//     function findAndAddReply(comments) {
//       for (let i = 0; i < comments.length; i++) {
//         if (comments[i]._id.equals(commentId)) {
//           comments[i].replies.push(reply);
//           return true;
//         } else if (findAndAddReply(comments[i].replies)) {
//           return true;
//         }
//       }
//       return false;
//     }
  
//     // Find the post by ID and add the reply to the appropriate comment or reply
//     const post=await Post.findById(postId);

//       if(!post){
//         return res.status(404).json({ error: 'Post not found' });
//       }
//       const updatedPost=findAndAddReply(post.comments);

//       if (!findAndAddReply(post.comments)) {
//         return res.status(404).json({ error: 'Comment or reply not found' });
//       }
  
//       return res.status(200).json(post);

//   });
  











module.exports=router
