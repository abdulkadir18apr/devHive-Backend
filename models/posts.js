const mongoose =require('mongoose');

const {Schema}=mongoose;

const commentSchema = new mongoose.Schema({
  content: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users' // Reference to the User model
  },
  replies: [this] // Self-referencing array field for storing replies (nested comments)
});




const postSchema=new Schema({
    content:String,
    likes:{
        likeCount:{type:Number,default:0},
        likedBy:[{type:mongoose.Types.ObjectId,ref:'users'}],
        dislikedBy:[{type:mongoose.Types.ObjectId,ref:'users'}]
    },
    comments:[commentSchema],
    postImage:String,
    user:{type:mongoose.Types.ObjectId,ref:'users'},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
})
module.exports=mongoose.model('posts',postSchema);


