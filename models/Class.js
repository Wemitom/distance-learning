const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassSchema = new Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  users: [String],
  limit: { type: Number, min: 5 },
  accessCode: {
    type: String,
    unique: true,
  },
});

const ClassModel = mongoose.model('Classes', ClassSchema);

module.exports = ClassModel;
