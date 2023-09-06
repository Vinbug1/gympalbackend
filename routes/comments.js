const express = require('express');
const router = express.Router();
const Comment = require('../models/comment'); // Adjust the path to your model


router.get('/comments/:postId', async (req, res) => {
    try {
      const comments = await Comment.find({ post: req.params.postId }).sort({ createdAt: 'asc' });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  router.put('/comments/:id', async (req, res) => {
    try {
      const { content } = req.body;
      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { content },
        { new: true }
      );
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: 'Error updating comment' });
    }
  });
  
router.post('/comments', async (req, res) => {
  try {
    const { user, post, content } = req.body;
    const comment = new Comment({ user, post, content });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment' });
  }
});
router.delete('/comments/:id', async (req, res) => {
    try {
      const deletedComment = await Comment.findByIdAndRemove(req.params.id);
      res.json(deletedComment);
    } catch (error) {
      res.status(500).json({ message: 'Error deleting comment' });
    }
  });
  

module.exports = router;
