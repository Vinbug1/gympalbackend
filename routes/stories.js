const  User  = require("../models/user");
const  Story  = require("../models/story");
const express = require("express");
const router = express.Router();
const multer = require("multer");
require("dotenv").config();
const { Storage } = require('@google-cloud/storage');


const storage = new Storage({
  projectId: 'imagekeep-ac687  ', // Replace with your Google Cloud project ID
  keyFilename: '../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
});

// Set up Multer for handling file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Create a new story
router.post('/', upload.single("image"), async (req, res) => {
  try {
    const admin = require('firebase-admin');
    const serviceAccount = require('../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'gs://imagekeep-ac687.appspot.com', // Replace with your actual Firebase Storage bucket URL
    });

    const bucket = admin.storage().bucket(); // Define bucket here
    const imageBuffer = req.file.buffer;
    const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(uniqueFileName);
    const fileStream = file.createWriteStream();

    fileStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: 'Error uploading image' });
    });
    fileStream.on('finish', async () => {
      // Save the image path to MongoDB
      const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
    
      //const { content, user:userId } = req.body;
      const { content, userId } = req.body;

    const existingUser = await User.findById(userId); // Assuming userId uniquely identifies users

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

      const story = new Story({
        image: imagePath,
        content,
        user:userId,
      });
    
      const saveStory = await story.save();
    
      res.status(200).json({
        message: 'add new story was successfully',
        story: {
          ...saveStory.toObject(), // Convert Mongoose document to a plain JavaScript object
          image: imagePath // Add the image URL to the response
        }
      });
    });
    fileStream.end(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



// Get all stories
// router.get('/', async (req, res) => {
//     try {
//       // Fetch stories from the database, populate the 'user' field, and sort by 'createdAt' in descending order
//       const stories = await Story.find()
//         .populate('user')
//         .sort({ createdAt: -1 });
  
//       // Modify the fetched stories to include the user image URLs
//       const formattedStories = stories.map(story => {
//         return {
//           ...story._doc,
//           user: {
//             ...story.user._doc,
//             image: story.user.image // Assuming user.image contains the image URL
//           }
//         };
//       });
  
//       // Send the formatted stories as a JSON response
//       res.json(formattedStories);
//     } catch (error) {
//       // If an error occurs, log the error and send a 500 status code with an error message
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred' });
//     }
//   });

router.get('/', async (req, res) => {
  try {
    // Fetch stories from the database, populate the 'user' field, and sort by 'createdAt' in descending order
    const stories = await Story.find()
      .populate('user')
      .sort({ createdAt: -1 });

    // Create an array to store the unique user IDs
    const uniqueUserIds = new Set();

    // Modify the fetched stories to include the user image URLs and collect unique user IDs
    const formattedStories = stories.map(story => {
      // Add the user's ID to the uniqueUserIds set
      uniqueUserIds.add(story.user._id.toString());

      return {
        ...story._doc,
        user: {
          ...story.user._doc,
          image: story.user.image // Assuming user.image contains the user's image URL
        },
        // Include the story image URL if available in your Story model
        storyImage: story.image, // Assuming you store the story image URL in the 'image' field
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

    // Add stories to user data based on user IDs
    formattedStories.forEach(story => {
      const userId = story.user._id.toString();
      if (userDataMap.has(userId)) {
        userDataMap.get(userId).stories = userDataMap.get(userId).stories || [];
        userDataMap.get(userId).stories.push(story);
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

router.get('/userId', async (req, res) => {
  try {
    const userId = req.query.userId; // Get the user ID from the query parameter

    // Fetch stories from the database for the specified user, populate the 'user' field, and sort by 'createdAt' in descending order
    const stories = await Story.find({ 'user': userId })
      .populate('user')
      .sort({ createdAt: -1 });

    // Modify the fetched stories to include the user image URLs
    const formattedStories = stories.map(story => {
      return {
        ...story._doc,
        user: {
          ...story.user._doc,
          image: story.user.image // Assuming user.image contains the user's image URL
        },
        // Include the story image URL if available in your Story model
        storyImage: story.image, // Assuming you store the story image URL in the 'image' field
      };
    });

    // Send the formatted stories as a JSON response
    res.json(formattedStories);
  } catch (error) {
    // If an error occurs, log the error and send a 500 status code with an error message
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




module.exports = router;