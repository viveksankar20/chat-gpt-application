import mongoose from 'mongoose';

export interface IMessage {
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
  chatId: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema); 