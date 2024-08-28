const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  referralId: {
    type: String,
    default: null,
  },
  referralLink: {
    type: String,
    default: null,
  },
  friends: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// user model
const user_model = mongoose.model('user_model', userSchema);

module.exports = user_model;
