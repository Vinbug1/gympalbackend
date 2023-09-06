const  User  = require("../models/user");
const  Story  = require("../models/story");
const express = require("express");
const router = express.Router();
const multer = require("multer");
require("dotenv").config();

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
  
// Create a new story
router.post('/', uploadOptions.single("image"), async (req, res) => {
  try {
    const { filename } = req.file;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    const { content, user } = req.body;
    const story = new Story({
      image: `${basePath}${filename}`,
      content,
      user
    });

    await story.save();
    res.status(200).json(story);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Get all stories
router.get('/', async (req, res) => {
    try {
      // Fetch stories from the database, populate the 'user' field, and sort by 'createdAt' in descending order
      const stories = await Story.find()
        .populate('user')
        .sort({ createdAt: -1 });
  
      // Modify the fetched stories to include the user image URLs
      const formattedStories = stories.map(story => {
        return {
          ...story._doc,
          user: {
            ...story.user._doc,
            image: story.user.image // Assuming user.image contains the image URL
          }
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

  router.get('/', async (req, res) => {
    try {
      const userId = req.query.userId; // Get the user ID from the query parameter
      
      // Fetch stories from the database, populate the 'user' field, and sort by 'createdAt' in descending order
      const stories = await Story.find({ user: userId })
        .populate('user')
        .sort({ createdAt: -1 });
  
      // Modify the fetched stories to include the user image URLs
      const formattedStories = stories.map(story => {
        return {
          ...story._doc,
          user: {
            ...story.user._doc,
            image: story.user.image // Assuming user.image contains the image URL
          }
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














// const { User } = require("../models/user");
// const { Story} = require("../models/story");
// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const multer = require("multer");
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const FILE_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpeg",
//   "image/gif": "gif",
// };

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const isValid = FILE_TYPE_MAP[file.mimetype];
//     let uploadError = new Error("Invalid image type");

//     if (isValid) {
//       uploadError = null;
//     }

//     cb(uploadError, "public/uploads");
//   },
//   filename: function (req, file, cb) {
//     const fileName = file.originalname.split(" ").join("-");
//     const extension = FILE_TYPE_MAP[file.mimetype];
//     const timestamp = Date.now();
//     cb(null, `${fileName}-${timestamp}.${extension}`);
//   },
// });

// const uploadOptions = multer({ storage: storage });

// // Create a new story
// app.post('/api/stories',uploadOptions.single("image"), async (req, res) => {
//     const fileName = file.filename;
//     const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
//     console.log(basePath);

//     const user = await User.findById(req.body.user);
//       if (!user) {
//         return res.status(400).send('Invalid User');
//       }
    
//     try {
//         const {  content, user } = req.body;
//       const story = new Story({ 
//         image: `${basePath}${fileName}`,
//         content,
//         user: user
//     });
//       await story.save();
//       res.status(201).json(story);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred' });
//     }
//   });
  
//   // Get all stories
//   app.get('/api/stories', async (req, res) => {
//     try {
//       const stories = await Story.find().sort({ createdAt: -1 });
//       res.json(stories);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred' });
//     }
//   });
  

// // // Upload a new story
// // router.post('/upload', upload.single('storyImage'), async (req, res) => {
// //     try {
// //       const { buffer, mimetype } = req.file;
      
// //       // Save story to the database
// //       const story = new Story({
// //         image: {
// //           data: buffer,
// //           contentType: mimetype
// //         },
// //         createdAt: new Date()
// //       });
  
// //       await story.save();
// //       res.status(201).json({ message: 'Story uploaded successfully' });
// //     } catch (error) {
// //       console.error(error);
// //       res.status(500).json({ error: 'An error occurred' });
// //     }
// //   });

//   module.exports = router;
