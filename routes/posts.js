const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const Comment = require("../models/comment");
const { User } = require("../models/user");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  projectId: "imagekeep-ac687", // Replace with your Google Cloud project ID
  keyFilename: "../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json", // Replace with your service account key file path
});

// Set up Multer for handling file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

router.get("/", async (req, res) => {
  try {
    // Fetch posts and populate user details
    const postList = await Post.find().populate("user");

    res.send(postList);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).send("Internal server error");
  }
});

router.get('/', async (req, res) => {
  try {
    // Fetch posts from the database, populate the 'user' field, and sort by 'createdAt' in descending order
    const posts = await Post.find()
      .populate('user')
      .sort({ createdAt: -1 });

    // Create an array to store the unique user IDs
    const uniqueUserIds = new Set();

    // Modify the fetched posts to include the user image URLs and collect unique user IDs
    const formattedStories = posts.map(post => {
      // Add the user's ID to the uniqueUserIds set
      uniqueUserIds.add(post.user._id.toString());

      return {
        ...post._doc,
        user: {
          ...post.user._doc,
          image: post.user.image // Assuming user.image contains the user's image URL
        },
        // Include the story image URL if available in your Story model
        storyImage: post.image, // Assuming you store the story image URL in the 'image' field
      };
    });

    // Fetch users' data for the unique user IDs
    const users = await User.find({ _id: { $in: Array.from(uniqueUserIds) } });
    // Create a map to store user data by user ID
    const userDataMap = new Map();

    // Populate the user data map with user IDs as keys
    users.forEach(user => {
      userDataMap.set(user._id.toString(), user);
    });

    // Add posts to user data based on user IDs
    formattedPosts.forEach(post => {
      const userId = post.user._id.toString();
      if (userDataMap.has(userId)) {
        userDataMap.get(userId).posts = userDataMap.get(userId).posts || [];
        userDataMap.get(userId).posts.push(post);
      }
    });

    // Send the formatted user data as a JSON response
    res.json(Array.from(userDataMap.values()));
  } catch (error) {
    // If an error occurs, log the error and send a 500 status code with an error message
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
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

router.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await Comment.find({ post: postId }).sort({
      createdAt: "asc",
    });
    const user = await User.findById(post.user).select("name image");
    const poster = await User.findById(post.user).select("name image");

    const postWithDetails = {
      _id: post._id,
      user: user,
      poster: poster,
      content: post.content,
      image: post.image,
      comments: comments,
    };

    res.json(postWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

router.put("/posts/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const admin = require("firebase-admin"); // Move this line outside of the route handler

    const serviceAccount = require("../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json"); // Define and provide the correct path to your service account key file

    // Initialize Firebase Admin SDK once with a unique app name
    const adminInt = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "gs://imagekeep-ac687.appspot.com", // Replace with your actual Firebase Storage bucket URL
    });

    const bucket = adminInt.storage().bucket(); // Define bucket here
    const imageBuffer = req.file.buffer;
    const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(uniqueFileName);
    const fileStream = file.createWriteStream();

    fileStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Error uploading image" });
    });

    fileStream.on("finish", async () => {
      // Save the image path to MongoDB
      const imagePath = `gs://${bucket.name}/${uniqueFileName}`;

      const { user, content } = req.body;

      const existingUser = await User.findById(user); // Assuming userId uniquely identifies users

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const post = new Post({
        image: imagePath,
        content,
        user,
      });
      const savePost = await post.save();
      res.status(200).json({
        message: "add new post was successfully",
        post: {
          ...savePost.toObject(), // Convert Mongoose document to a plain JavaScript object
          image: imagePath, // Add the image URL to the response
        },
      });
    });

    fileStream.end(imageBuffer);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
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

router.delete("/posts/:id", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndRemove(req.params.id);
    res.json(deletedPost);
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

module.exports = router;
