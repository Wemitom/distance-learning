const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema({
  sender: {
    uid: { type: String, required: true },
    fullname: { type: String, required: true },
  },
  receiver: {
    uid: { type: String, required: true },
    fullname: { type: String, required: true },
  },
  message: { type: String, required: true },
  class: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

const ChatMessageModel = mongoose.model('ChatMessages', ChatMessageSchema);

module.exports = ChatMessageModel;
