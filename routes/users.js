const  {User}  = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { Storage } = require('@google-cloud/storage');
const { validationResult } = require('express-validator');
const admin = require('firebase-admin');

    const serviceAccount = require('../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'gs://imagekeep-ac687.appspot.com', // Replace with your actual Firebase Storage bucket URL
    });



const storage = new Storage({
  projectId: 'imagekeep-ac687  ', // Replace with your Google Cloud project ID
  keyFilename: '../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
});

// Set up Multer for handling file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

//const Image = mongoose.model('Image', User);

router.get('/:userId', async (req, res) => {
  const loggedInUserId = req.params.userId;

  try {
    // Fetch images and details of other users except the user with the provided userId
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select('-passwordHash'); // Exclude the passwordHash field
    const imageUrls = [];

    for (const user of users) {
      const gcsPath = user.image.replace(/^gs:\/\/(.*?)\//, ''); // Remove 'gs://' prefix and up to the first '/'
      const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
        action: 'read',
        // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
      });
      imageUrls.push({ imageUrl: publicUrl, userDetails: user });
    }
    res.json(imageUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});


// const FILE_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpeg",
//   "image/gif": "gif",
// };

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       const isValid = FILE_TYPE_MAP[file.mimetype];
//       let uploadError = new Error("Invalid image type");
  
//       if (isValid) {
//         uploadError = null;
//       }
  
//       cb(uploadError, "public/uploads");
//     },
//     filename: function (req, file, cb) {
//       const originalFileName = file.originalname;
//       const extension = FILE_TYPE_MAP[file.mimetype];
      
//       // Remove the timestamp from the filename
//       const fileNameWithoutTimestamp = originalFileName.split("-")[0];
  
//       cb(null, `${fileNameWithoutTimestamp}-${Date.now()}.${extension}`);
//     },
//   });
  
  //const uploadOptions = multer({ storage: storage });

  //endpoint to access all the users except the user who's is currently logged in!

  // router.get("/:userId", async(req, res) => {
  //   const loggedInUserId = req.params.userId;

  //   try {
  //     const images = await Image.find({}, 'path'); // Retrieve only the 'path' field
  //     const imageUrls = await Promise.all(images.map(async (image) => {
  //       const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, ''); // Remove 'gs://' prefix and up to the first '/'
  //       console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
  //       const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
  //         action: 'read',
  //        // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
  //       });
  //       console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
  //       return publicUrl;
  //     }));
      
  //     res.json({ images: imageUrls });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Error fetching images' });
  //   }
  //   User.find({ _id: { $ne: loggedInUserId } })
  //     .then((users) => {
  //       res.status(200).json(users);
  //     })
  //     .catch((err) => {
  //       //console.error("Error retrieving users", err);
  //       res.status(500).json({ message: `Error retrieving users: ${err.message}` });
  //     });
      
  // });
  
  
// router.get("/:userId", (req, res) => {
//   const loggedInUserId = req.params.userId;
//   User.find({ _id: { $ne: loggedInUserId } }).then((users) => {
//       res.status(200).json(users);
//     }).catch((err) => {
//       console.log("Error retrieving users", err);
//       res.status(500).json({ message: "Error retrieving users" });
//     });
// }); 
  
  
router.get("/", async (req, res) => {
  try {
    // Fetch a list of users, excluding the passwordHash field
    const userList = await User.find().select("-passwordHash");

    // Send the list of users as a response
    res.json(userList);
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get followers of the current logged-in user
router.get("/followers", async (req, res) => {
    try {
      const currentUser = req.user; // Assuming you have authenticated the user
      
      // Find the followers using the IDs stored in the currentUser's followers array
      const followers = await User.find({ _id: { $in: currentUser.followers } }).select("-passwordHash");
      
      res.status(200).json(followers);
    } catch (error) {
      console.error("Error getting followers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
// Get user by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select("-passwordHash");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).send(user);
//   } catch (error) {
//     console.error("Error getting user by ID:", error);
//     res.status(500).send("Internal server error");
//   }
// });

// Update user by ID
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const image = await fetchUserImage(user);

    const responseData = {
      image,
      userId: user.id,
      email: user.email,
      address: user.address,
      token,
      name: user.name,
      phone: user.phoneNumber,
      country: user.country,
      selectedItem: user.selectedItem,
      selectedItems: user.selectedItems,
      selectedReason: user.selectedReason,
      followers: user.followers,
      followings: user.following,
      status: user.status,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate JWT token
function generateToken(user) {
  const secret = process.env.SECRET;
  return jwt.sign(
    {
      userId: user._id,
      isAdmin: user.isAdmin,
    },
    secret,
    { expiresIn: '24h' }
  );
}

// Helper function to fetch user image from Firebase
async function fetchUserImage(user) {
  try {
    const gcsPath = user.image.replace(/^gs:\/\/(.*?)\//, '');
    const [publicUrl] = await admin
      .storage()
      .bucket()
      .file(gcsPath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });

    return publicUrl || '';
  } catch (error) {
    console.error('Error fetching Firebase Storage URL:', error);
    return ''; // Return an empty string or handle the error as needed
  }
}



router.post("/register", upload.single("image"), async (req, res) => {
  try {
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
    
      // Create a new user and add the image URL to it
      const { name, email, password, phoneNumber, selectedItem, selectedItems, selectedReason, status } = req.body;
      const passwordHash = bcrypt.hashSync(password, 10);
      
      const user = new User({
        name,
        email,
        passwordHash,
        phoneNumber,
        selectedItem,
        selectedItems,
        selectedReason,
        image: imagePath, // Add the image URL to the user object
        status
      });
    
      const savedUser = await user.save();
    
      res.status(200).json({
        message: 'Image and user uploaded successfully',
        user: {
          ...savedUser.toObject(), // Convert Mongoose document to a plain JavaScript object
          image: imagePath // Add the image URL to the response
        }
      });
    });
    

    fileStream.end(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }

});

// Delete user by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    res.status(500).send("Internal server error");
  }
});

// Get user count
router.get("/get/count", async (req, res) => {
  try {
    const userCount = await User.countDocuments({});

    res.send({
      userCount,
    });
  } catch (error) {
    console.error("Error getting user count:", error);
    res.status(500).send("Internal server error");
  }
});
// Function to generate a 4-digit random pin
function generateRandomPin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Function to send the pin to the user's email using Nodemailer
function sendPinToEmail(email, pin) {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // Outlook SMTP server
    port: 587, // Port for sending emails
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your 4-Digit Registration PIN",
    text: `Your registration PIN is: ${pin}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

router.post("/complete", async (req, res) => {
  try {
    const { email, pin } = req.body;
    const message = "Registration complete. You are verified!";

    // Find the user in the database based on the email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.pin === pin && user.pinExpiry > Date.now()) {
      user.verified = true;
      user.pin = undefined;
      user.pinExpiry = undefined;
      await user.save();

      return res.status(200).json({ message });
    } else {
      return res
        .status(400)
        .json({ error: "Invalid PIN. Request a new code to register." });
    }
  } catch (error) {
    console.error("Error completing registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
  
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      // Generate a new PIN and set its expiration time
      const pin = generateRandomPin();
      const pinExpiry = new Date();
      pinExpiry.setMinutes(pinExpiry.getMinutes() + 10); // 10 minutes from now
  
      user.pin = pin;
      user.pinExpiry = pinExpiry;
      await user.save();
  
      // Send the PIN to the user's email
      sendPinToEmail(email, pin);
  
      res.status(200).json({ message: "Check your email for the PIN" });
    } catch (error) {
      console.error("Error sending PIN for password reset:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  router.post("/reset-password", async (req, res) => {
    try {
      const { email, pin, newPassword } = req.body;
  
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      // Check if the provided PIN matches the user's stored PIN and is not expired
      if (user.pin === pin && user.pinExpiry > Date.now()) {
        // Hash the new password
        const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  
        // Update the user's password hash and reset the PIN fields
        user.passwordHash = newPasswordHash;
        user.pin = undefined;
        user.pinExpiry = undefined;
        await user.save();
  
        res.status(200).json({ message: "Password reset successful" });
      } else {
        res.status(400).json({ error: "Invalid PIN or PIN expired" });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  //endpoint to send a request to a user
router.post("/friend-request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;

  try {
    //update the recepient's friendRequestsArray!
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { freindRequests: currentUserId },
    });

    //update the sender's sentFriendRequests array
    await User.findByIdAndUpdate(currentUserId, {
      $push: { sentFriendRequests: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

//endpoint to show all the friend-requests of a particular user
router.get("/friend-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user document based on the User id
    const user = await User.findById(userId)
      .populate("freindRequests", "name email image")
      .lean();

    const freindRequests = user.freindRequests;

    res.json(freindRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint to accept a friend-request of a particular person
router.post("/friend-request/accept", async (req, res) => {
  try {
    const { senderId, recepientId } = req.body;

    //retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    recepient.freindRequests = recepient.freindRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recepientId.toString
    );

    await sender.save();
    await recepient.save();

    res.status(200).json({ message: "Friend Request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint to access all the friends of the logged in user!
router.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email image"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/friend-requests/sent/:userId",async(req,res) => {
  try{
    const {userId} = req.params;
    const user = await User.findById(userId).populate("sentFriendRequests","name email image").lean();

    const sentFriendRequests = user.sentFriendRequests;

    res.json(sentFriendRequests);
  } catch(error){
    console.log("error",error);
    res.status(500).json({ error: "Internal Server" });
  }
})

router.get("/friends/:userId",(req,res) => {
  try{
    const {userId} = req.params;

    User.findById(userId).populate("friends").then((user) => {
      if(!user){
        return res.status(404).json({message: "User not found"})
      }

      const friendIds = user.friends.map((friend) => friend._id);

      res.status(200).json(friendIds);
    })
  } catch(error){
    console.log("error",error);
    res.status(500).json({message:"internal server error"})
  }
})

module.exports = router;
