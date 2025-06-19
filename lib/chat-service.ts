import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import type { Chat as ChatType, Message as MessageType } from "@/types/chat"
import { streamGroqChatCompletion, GroqChatMessage } from "@/lib/ai"

// Utility to strip <think>...</think> tags from model output
function stripThinkTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

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

    return messages.map((msg: IMessage) => ({
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

  static async createChat(title: string, userId = "default-user"): Promise<ChatType> {
    await connectDB()

    const newChat = new Chat({
      title,
      userId,
    })

    await newChat.save()

    return {
      id: newChat._id.toString(),
      title: newChat.title,
      createdAt: newChat.createdAt.toISOString(),
      updatedAt: newChat.updatedAt.toISOString(),
      messageCount: 0,
    }
  }

  static async createUserMessage(chatId: string, content: string): Promise<MessageType> {
    await connectDB()

    const userMessage = new Message({
      chatId,
      role: "user",
      content,
    })
    await userMessage.save()

    // Update chat's updatedAt
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() })

    return {
      id: userMessage._id.toString(),
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    }
  }

  static async createAssistantMessage(chatId: string, userContent: string, model?: string): Promise<MessageType> {
    await connectDB()

    // Get conversation history
    const previousMessages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .lean<IMessage[]>()

    // Convert to Groq message format
    const groqMessages: GroqChatMessage[] = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
    // Add the new user message
    groqMessages.push({ role: "user", content: userContent })

    // Get AI response (stream and collect)
    const stream = await streamGroqChatCompletion({ messages: groqMessages, model })
    let assistantContent = ""
    for await (const chunk of stream) {
      assistantContent += chunk.choices[0]?.delta?.content || ''
    }

    // Strip <think>...</think> tags
    const cleanContent = stripThinkTags(assistantContent)

    // Save assistant response
    const assistantMessage = new Message({
      chatId,
      role: "assistant",
      content: cleanContent,
    })
    await assistantMessage.save()

    // Update chat's updatedAt
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() })

    return {
      id: assistantMessage._id.toString(),
      role: assistantMessage.role,
      content: cleanContent,
      createdAt: assistantMessage.createdAt.toISOString(),
    }
  }
}
