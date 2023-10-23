const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
      required: true
     },
  content: { 
    type: String, 
    required: true 
}, 
like:{
    type:Number,
    default: 0
},
  image: { type: String},
    
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
