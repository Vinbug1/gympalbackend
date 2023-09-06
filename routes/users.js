const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
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
      const originalFileName = file.originalname;
      const extension = FILE_TYPE_MAP[file.mimetype];
      
      // Remove the timestamp from the filename
      const fileNameWithoutTimestamp = originalFileName.split("-")[0];
  
      cb(null, `${fileNameWithoutTimestamp}-${Date.now()}.${extension}`);
    },
  });
  
  const uploadOptions = multer({ storage: storage });

  router.get("/:id", (req, res) => {
    const loggedInUserId = req.params.userId;
  
    // If you want to exclude the logged-in user, you can use a different query
    User.find({ _id: { $ne: loggedInUserId } })
      .then((users) => {
        res.status(200).json(users);
      })
      .catch((err) => {
        console.log("Error retrieving users", err);
        res.status(500).json({ message: "Error retrieving users" });
      });
   
  });
  
  
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
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, isAdmin, role, address } =
      req.body;

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let passwordHash = existingUser.passwordHash;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        address,
        passwordHash,
        phoneNumber,
        country,
        selectedItem,
        selectedItems,
        selectedReason,
        biography
      },
      { new: true }
    );

    res.send(updatedUser);
  } catch (error) {
    console.error("Error updating user by ID:", error);
    res.status(500).send("Internal server error");
  }
});

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
  
      const secret = process.env.SECRET;
      const token = jwt.sign(
        {
          userId: user._id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: '1d' }
      );
      
      // Update user's last login time and other necessary actions if needed
      // user.lastLoginTime = new Date();
      // await user.save();
  
      const responseData = {
        image: user.image || '',
        userId: user.id,
        email: user.email,
        address: user.address,
        token: token,
        name: user.name,
        phone: user.phoneNumber,
        country: user.country,
        selectedItem: user.selectedItem,
        selectedItems: user.selectedItems,
        selectedReason: user.selectedReason,
        followers: user.followers,
        followings: user.following,
        biography: user.biography,
      };
      
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error during user login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
// Register vendor and user
router.post("/register", uploadOptions.single("image"), async (req, res) => {
  try {
    // Generate a 4-digit random pin
    const pin = generateRandomPin();

    // Set the PIN expiration time (10 minutes from now)
    const pinExpiry = new Date();
    pinExpiry.setMinutes(pinExpiry.getMinutes() + 45); // 10 minutes from now
    const {
      name,
      email,
      password,
      phoneNumber,
      selectedItem,
      selectedItems,
      selectedReason,      biography,

    } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).send("No image in the request");
    }
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    console.log(basePath);
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = new User({
      name,
      email,
      passwordHash,
      phoneNumber,
      selectedItem,
      selectedItems,
      selectedReason,
      image: `${basePath}${fileName}`,
      biography,     
    });
    const savedUser = await user.save();
    sendPinToEmail(email, pin); // You need to implement this function
    res.send(savedUser);
  } catch (error) {
    console.error( error);
    res.status(500).json({error:"Internal server error", message: error.message} );
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
  // Follow a user
router.post("/:id/follow", async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.id);
      const currentUser = req.user; // Assuming you have authenticated the user
  
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
  
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
  
      await currentUser.save();
      await userToFollow.save();
  
      res.status(200).json({ message: "Successfully followed" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Unfollow a user
  router.post("/:id/unfollow", async (req, res) => {
    try {
      const userToUnfollow = await User.findById(req.params.id);
      const currentUser = req.user; // Assuming you have authenticated the user
  
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }
  
      currentUser.following.pull(userToUnfollow._id);
      userToUnfollow.followers.pull(currentUser._id);
  
      await currentUser.save();
      await userToUnfollow.save();
  
      res.status(200).json({ message: "Successfully unfollowed" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get count of followers for a user
router.get("/:id/followers/count", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const followersCount = user.followers.length;
      res.status(200).json({ followersCount });
    } catch (error) {
      console.error("Error getting followers count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get count of users being followed by a user
  router.get("/:id/following/count", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const followingCount = user.following.length;
      res.status(200).json({ followingCount });
    } catch (error) {
      console.error("Error getting following count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

module.exports = router;
