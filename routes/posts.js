const express = require('express');
const router = express.Router();
const Post = require('../models/post'); // Adjust the path to your model
const Comment = require('../models/comment'); // Adjust the path to your comment model
const User = require('../models/user'); // Adjust the path to your user model
const multer = require("multer");


const FILE_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/gif": "gif",
  };
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const isValid = FILE_TYPE_MAP[file.mimetype];
      let uploadError = new Error("Invalid image type");
  
      if (isValid) {
        uploadError = null;
      }
  
      cb(uploadError, "public/uploads");
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(" ").join("-");
      const extension = FILE_TYPE_MAP[file.mimetype];
      const timestamp = Date.now();
      cb(null, `${fileName}-${timestamp}.${extension}`);
    },
  });
  
  const uploadOptions = multer({ storage: storage });
  


  router.get("/", async (req, res) => {
    try {
      // Fetch posts and populate user details
      const postList = await Post.find().populate('user');
  
      res.send(postList);
    } catch (error) {
      console.error("Error getting posts:", error);
      res.status(500).send("Internal server error");
    }
  });

  
  
  
  // Endpoint to get the total number of posts by the current user
  router.get("/post-count/:id", async (req, res) => {
    try {
      const userId = req.query.userId; // Get the userId from the query parameter
  
      const postCount = await Post.countDocuments({ user: userId });
  
      res.json({ postCount });
    } catch (error) {
      console.error("Error counting posts:", error);
      res.status(500).json({ message: "Error counting posts" });
    }
  });
  
  // Endpoint to get the full details of posts by the current user
  router.get("/user-posts/:id", async (req, res) => {
    try {
      const userId = req.query.userId; // Get the userId from the query parameter
  
      const userPosts = await Post.find({ user: userId }).populate("user");
  
      res.json(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Error fetching user posts" });
    }
  });
  
  
  
// router.get("/", async (req, res) => {
//     try {
//       const postList = await Post.find();
//       res.send(postList);
//     } catch (error) {
//       //console.error("Error getting Buyer users:", error);
//       res.status(500).send("Internal server error");
//     }
//   });

  router.get('/posts/:id', async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await Post.findById(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      const comments = await Comment.find({ post: postId }).sort({ createdAt: 'asc' });
      const user = await User.findById(post.user).select("name image");
      const poster = await User.findById(post.user).select("name image");
  
      const postWithDetails = {
        _id: post._id,
        user: user,
        poster: poster,
        content: post.content,
        image: post.image,
        comments: comments
      };
      
      res.json(postWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post' });
    }
  });
  

  router.put('/posts/:id', async (req, res) => {
    try {
      const { content } = req.body;
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { content },
        { new: true }
      );
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error updating post' });
    }
  });

  router.post('/', uploadOptions.single("image"), async (req, res) => {
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  
    try {
      const { user, content } = req.body;
      const post = new Post({ user, content, image: `${basePath}${fileName}` });
  
      await post.save();
  
      res.status(200).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: 'Error creating post' });
    }
  });
  
  
// router.post('/',uploadOptions.single("image"), async (req, res) => {

//     const fileName = req.file.filename;
//     const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
//   try {
//     const { user, content } = req.body;
//     const post = new Post({ user, content, image: `${basePath}${fileName}` });
//     await post.save();
//     res.status(200).json(post);
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating post' });
//   }
// });

router.delete('/posts/:id', async (req, res) => {
    try {
      const deletedPost = await Post.findByIdAndRemove(req.params.id);
      res.json(deletedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error deleting post' });
    }
  });
  
module.exports = router;
