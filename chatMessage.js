const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    indexed: true,
  },
  userId: {
    type: String,
    required: false, // Can be null for anonymous chats
    indexed: true,
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai'],
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
