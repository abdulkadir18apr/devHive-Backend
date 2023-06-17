const User=require("../models/users");
const express=require("express");
const router=express.Router();

const {default:mongoose} =require('mongoose');
var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const { body, validationResult } = require('express-validator');



router.post("/signup",[],async(req,res)=>{


    const errors= validationResult(req);
    if(!errors.isEmpty){
        return res.status(400).json({success:false,errors})
    }
    try{
        let user=await User.findOne({username:req.body.username});
        if(user){
            return res.status(400).json({success:false,errors:"userName Already registered "});
        }
        const salt=await bcrypt.genSalt(10);
        const secPass=await bcrypt.hashSync(req.body.password,salt);
        user=await User.create({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            username:req.body.username,
            password:secPass
        });
        await user.save();
        const data={
            user:{
                id:user.id
            }
        }

        const authToken=await jwt.sign(data,process.env.JWT_KEY);
        res.json({success:true,authToken,user});

    }
    catch(err){
        return res.status(400).json({success:false,errors:err.message})
    }
    
})

router.post("/login",[],async(req,res)=>{
    const errors=validationResult(req);
    if(!errors){
        return res.status(400).json({success:false,errors});
    }
    try{

        const user=await User.findOne({username:req.body.username});
        if(!user){
            return res.status(400).json({success:false,errors:"Invalid credentials"})
        }
        const passCompare=await bcrypt.compare(req.body.password,user.password);
        if(!passCompare){
            return res.status(400).json({success:false,errors:"Invalid credentials"});
        }
        const data={
            user:{
                id:user.id
            }
        }
        const authToken=jwt.sign(data,process.env.JWT_KEY);
        success=true;
        res.json({success,authToken,user});


    }
    catch(err){
        return res.status(400).json({success:false,errors:err.message})
    }
})


module.exports=router;