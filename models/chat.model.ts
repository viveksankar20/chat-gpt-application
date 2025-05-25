import mongoose, { type Document, Schema, type Model } from "mongoose"

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  chatId: mongoose.Types.ObjectId
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

const ChatSchema = new Schema<IChat>({
  title: {
    type: String,
    required: true,
    default: "New Chat",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    default: "default-user",
  },
})

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Update chat's updatedAt when a new message is added
MessageSchema.pre("save", async function (this: Document) {
  if (this.isNew) {
    const ChatModel = mongoose.models.Chat as Model<IChat>
    // @ts-ignore
    await ChatModel.findByIdAndUpdate(this.get("chatId"), { updatedAt: new Date() })
  }
})

export const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema)
export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
