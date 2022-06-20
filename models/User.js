const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv/config.js');

const UserSchema = new Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  role: { type: String, enum: ['Преподаватель', 'Студент'], required: true },
});

const UserModel = mongoose.model('Users', UserSchema);

module.exports = UserModel;
