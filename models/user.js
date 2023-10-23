const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,

  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  // address:{
  //   type: String,
  //   required: true,
  // },
  status: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
 
  selectedItem: {
    type: String,
    required: true,
  },
  selectedItems: [{
    type: String,
    required: true,
  }],
  selectedReason: [{
    type: String,
    required: true,
  }],
  freindRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sentFriendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

exports.User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
