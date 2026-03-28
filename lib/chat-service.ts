import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import type { Chat as ChatType, Message as MessageType } from "@/types/chat"
import { orchestrate } from "../backend/services/orchestrator.service"

// Utility to strip <think>...</think> tags from model output
function stripThinkTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export class ChatService {
  static async getChats(userId = "default-user"): Promise<ChatType[]> {
    await connectDB()

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean<IChat[]>()

    const chatsWithMessageCount = await Promise.all(
      chats.map(async (chat: any) => {
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

  static async getChatsByUserId(userId: string): Promise<ChatType[]> {
    return this.getChats(userId)
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

    // Last 10 messages in chronological order (newest window, not oldest 10 in thread)
    const recentDesc = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<IMessage[]>()
    const chronological = recentDesc.slice().reverse()

    const conversationText = chronological
      .map((m: IMessage) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n")

    // Avoid duplicating the latest user line: it is already the last line in conversationText
    const finalPrompt = conversationText.trim()
      ? `Conversation (most recent messages):\n${conversationText}\n\nRespond as the assistant.`
      : userContent

    // Use the new production orchestrator (Features 1,2,4,5,6,8)
    const orchestratorResult = await orchestrate(finalPrompt, { 
       modelId: model, 
       mode: model ? 'advanced' : 'smart' 
    });

    const cleanContent = stripThinkTags(orchestratorResult.response)

    // Save assistant response
    const assistantMessage = new Message({
      chatId,
      role: "assistant",
      content: String(cleanContent), // Force string conversion to prevent [object Object]
    })
    
    await assistantMessage.save()

    // Update chat's updatedAt
    await Chat.findByIdAndUpdate(chatId, { 
      updatedAt: new Date(),
      // Auto-generate title if it's currently "New Chat" and this is the first assistant response
      // (Optionally do this in createChat or here)
    })

    return {
      id: assistantMessage._id.toString(),
      role: assistantMessage.role,
      content: String(cleanContent),
      createdAt: assistantMessage.createdAt.toISOString(),
      isCached: orchestratorResult.isCached
    }
  }

  static async deleteChat(chatId: string): Promise<boolean> {
    await connectDB()
    try {
      // Delete all messages associated with the chat
      await Message.deleteMany({ chatId })
      // Delete the chat itself
      const result = await Chat.findByIdAndDelete(chatId)
      return !!result
    } catch (error) {
      console.error("Error deleting chat:", error)
      return false
    }
  }

  static async updateMessage(messageId: string, content: string): Promise<MessageType | null> {
    await connectDB()
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { content: String(content) },
      { new: true }
    )
    if (!updated) return null

    return {
      id: updated._id.toString(),
      role: updated.role,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
    }
  }

  static async updateChatTitle(chatId: string, title: string): Promise<boolean> {
    await connectDB()
    const result = await Chat.findByIdAndUpdate(chatId, { title })
    return !!result
  }
}
