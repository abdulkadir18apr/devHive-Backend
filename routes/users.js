const User=require("../models/users")
const express=require("express");
const multer = require('multer');
const path=require("path");
const fs = require('fs').promises;
const router=express.Router();
const authRequired=require("../middleware/authUtils");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary =require("cloudinary").v2;
const streamifier = require('streamifier');



cloudinary.config({ 
    cloud_name: 'durr83iqg', 
    api_key: '993891134356919', 
    api_secret: 'T7UnmkIbU31Oqk_vWUoQtvYinWc' 
  });


//route to get all users;

router.get("/",authRequired,async(req,res)=>{
    try{
        const users=await User.find().select('-password');
        return res.json({success:true,users});

    }
    catch(err){
        return res.status(400).json({success:false,error:err.message});
    }
});

//route to get specific user;

router.get("/:userId",authRequired,async(req,res)=>{
    try{
        const user=await User.findById(req.params.userId);
        if(!user){
            return res.status(404).json({success:false,user});
        }
        return res.json({success:true,user})

    }
    catch(err){
        return res.status(400).json({success:false,error:err.message});
    }
})


// add edit or update a profile of user


router.post("/profile",authRequired,upload.single('profile-image'),async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.user.id});
        if(!user){
            return res.status(404).json({success:true,msg:"user not found"});
        }
        if(req.body?.firstName){
            user.firstName=req.body.firstName
        }
        if(req.body?.lastName){
            user.firstName=req.body.lastName
        }
        let profileImage=null;
        let uploadResult=null;
        if(req.file){
            console.log("Inside");

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
            
        }
        profileImage=uploadResult.secure_url;

        const profile={
            bio:req.body?.bio || user?.profile?.bio,
            portfolio:req.body?.portfolio || user?.profile.portfolio,
            profileImage:profileImage!==null?profileImage:user?.profile?.profileImage
        }

        const updatedUser=await User.findByIdAndUpdate(req.user.id,{profile:profile},{new:true});
        await user.save();
        return res.json({success:true,user:updatedUser});

    }
    catch(err){
        return res.status(400).json({success:false,error:err.message});
    }
    
});

//bookmark post api;

//post abookmark

router.get("/bookmark/fetch-bookmark",authRequired,async(req,res)=>{
    const userId=req.user.id;
    try{
        const user=await User.findOne({_id:userId}).populate('bookmarks')
        if(!user){
            return res.status(404).json({success:false,msg:"user not found"});
        }
        return res.json({success:true,bookmarks:user.bookmarks});
    }
    catch(err){
        console.log(err)
        return res.status(404).json({success:false,err:err.message});
    }
})

router.post("/bookmark/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({success:false,msg:"user not found"});
        }
        const isBookmarked=user.bookmarks.some((currPost)=>currPost===postId);
        if(isBookmarked){
            return res.status(400).json({success:false,msg:"already bookmarked"});
        }
        user.bookmarks.push(postId);
        await user.save();
        return res.json({success:true,user});
    }
    catch(err){
        return res.status(400).json({success:false,error:err.message});
    }
});

//remove bookmark
router.post("/remove-bookmark/:postId",authRequired,async(req,res)=>{
    const postId=req.params.postId;
    const userId=req.user.id;
    try{
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({success:false,msg:"user not found"});
        }
        const isBookmarked=user.bookmarks.some((currPost)=>currPost.toString()===postId);

        if(!isBookmarked){
            return res.status(400).json({success:false,msg:"post is not bookmarked"});
        }
        const filterdBookmark=user.bookmarks.filter((currId=>currId.toString()!==postId));
       
        user.bookmarks=[...filterdBookmark];
        await user.save();
        return res.json({success:true,user});
    }
    catch(err){
        return res.status(400).json({success:false,error:err.message});
    }
});

//get a bookmark of user



//api fo follow user

router.post("/follow/:followUserId",authRequired,async(req,res)=>{
    try{
        const user=await User.findById(req.user.id);
        const userTobeFollowed=await User.findById(req.params.followUserId);
        if(req.user.id===req.params.followUserId){
            return res.status(400).json({success:false,msg:"You cannot follow yourself"});
        }
        const isAlreadyFollower=userTobeFollowed.followers.some((userId)=>userId.toString()===req.user.id);
        if(isAlreadyFollower){
            return res.status(400).json({success:false,msg:"Already a follower"});
        }
        user.following.push(req.params.followUserId);
        userTobeFollowed.followers.push(req.user.id);

        await user.save();
        await userTobeFollowed.save();

        return res.json({success:true,user,userTobeFollowed});
    }
    catch(err){
        return res.status(404).json({success:false,err:err.message});

    }
})



router.post("/unfollow/:followUserId",authRequired,async(req,res)=>{
    try{
        const user=await User.findById(req.user.id);
        const userTobeunFollowed=await User.findById(req.params.followUserId);
        if(req.user.id===req.params.followUserId){
            return res.status(400).json({success:false,msg:"You cannot unfollow yourself"});
        }
        const isAlreadyFollower=userTobeunFollowed.followers.some((userId)=>userId.toString()===req.user.id);
        if(!isAlreadyFollower){
            return res.status(400).json({success:false,msg:"you dosn't follow "});
        }
        const filteredFollowing=user.following.filter((currId)=>currId.toString()!==req.params.followUserId);

        user.following=[...filteredFollowing];


        const filteredFollowers=userTobeunFollowed.followers.filter((currId)=>currId.toString()!==req.user.id);
        userTobeunFollowed.followers=[...filteredFollowers];
        
        await user.save();
        await userTobeunFollowed.save();

        return res.json({success:true,user,userTobeunFollowed});
    }
    catch(err){
        return res.status(404).json({success:false,err:err.message});

    }
})

//route to get followes and following of user
router.get("/followers/fetch-followers",authRequired,async(req,res)=>{
    try{
        const user=await User.findById(req.user.id).populate('followers').populate('following');
        if(!user){
            return res.status(400).json({success:false,msg:"user not found"});
        }
        return res.json({success:true,user});
    }
    catch(err){
        return res.status(404).json({success:false,err:err.message});
        
    }
})




module.exports=router