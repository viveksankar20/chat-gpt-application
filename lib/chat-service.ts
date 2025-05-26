import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import type { Chat as ChatType, Message as MessageType } from "@/types/chat"

export class ChatService {
  static async getChats(userId = "default-user"): Promise<ChatType[]> {
    await connectDB()

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean<IChat[]>()

    const chatsWithMessageCount = await Promise.all(
      chats.map(async (chat) => {
        const messageCount = await Message.countDocuments({ chatId: chat._id })
        return {
          id: chat._id.toString(),
          title: chat.title,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          messageCount,
        }
      }),
    )

    return chatsWithMessageCount
  }

  static async getMessages(chatId: string): Promise<MessageType[]> {
    await connectDB()

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean<IMessage[]>()

    return messages.map((msg) => ({
      id: msg._id.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))
  }

  static async getChat(chatId: string): Promise<{ chat: ChatType; messages: MessageType[] } | null> {
    await connectDB()

    const chat = await Chat.findById(chatId).lean<IChat>()
    if (!chat) return null

    const messages = await this.getMessages(chatId)

    return {
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: messages.length,
      },
      messages,
    }
  }
}
