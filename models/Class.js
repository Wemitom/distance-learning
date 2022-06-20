const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassSchema = new Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  users: [String],
  limit: { type: Number, min: 5 },
  accessCode: {
    type: String,
    default: (
      new Date().getTime() + Math.floor(Math.random() * 10000 + 1)
    ).toString(16),
    unique: true,
  },
});

const ClassModel = mongoose.model('Classes', ClassSchema);

module.exports = ClassModel;
