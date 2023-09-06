const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  image: { 
    type: String,
     default:'' 
    }, 
  content:{
    type: String,
    required: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  createdAt: Date
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
