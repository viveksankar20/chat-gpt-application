import mongoose from 'mongoose';

export interface IChat {
  _id: mongoose.Types.ObjectId;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const chatSchema = new mongoose.Schema<IChat>(
  {
    title: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const messageSchema = new mongoose.Schema<IMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
