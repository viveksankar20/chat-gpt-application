import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema)

export default Message
