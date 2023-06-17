const mongoose =require('mongoose');

const {Schema}=mongoose;

const profileSchema=new Schema({
    portfolio:String,
    bio:String,
    profileImage:String,
})

const userScema=new Schema({
    firstName:String,
    lastName:String,
    username:String,
    password:String,
    createdAt:{type:Date,default:Date.now},
    profile:profileSchema,
    followers:[{type:mongoose.Types.ObjectId,ref:'users'}],
    following:[{type:mongoose.Types.ObjectId,ref:'users'}],
    bookmarks:[{type:mongoose.Types.ObjectId,ref:'posts'}]
})
module.exports=mongoose.model('users',userScema);


