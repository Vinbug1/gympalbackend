const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
      required: true
     },
//      comment: { 
//         type: mongoose.Schema.Types.ObjectId,
//          ref: 'Comment',
//           required: true
//          },
  content: { 
    type: String, 
    required: true 
}, // Short story content
like:{
    type:Number,
    default: 0
},
  image: { 
    type: String,
     default:'' 
    }, // URL of the uploaded image
    
  createdAt: { type: Date, default: Date.now },
  // Add more post-related fields as needed
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
