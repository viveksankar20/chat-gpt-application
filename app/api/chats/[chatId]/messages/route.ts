import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, AIMessage, type BaseMessage } from "@langchain/core/messages"
import mongoose from "mongoose"
import type { MessageResponse } from "@/types/chat"

const model = new ChatOpenAI({
  openAIApiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1",
  },
  modelName: "llama3-8b-8192",
})

interface RouteParams {
  params: {
    chatId: string
  }
}

// GET messages for a specific chat
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse<MessageResponse>> {
  try {
    await connectDB()

    const { chatId } = params

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID", success: false }, { status: 400 })
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean<IMessage[]>()

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({
      messages: formattedMessages,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages", success: false }, { status: 500 })
  }
}

// POST - Send message and get AI response
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse<MessageResponse>> {
  try {
    await connectDB()

    const { chatId } = params
    const body = await req.json()
    const { content, modelName = "llama3-8b-8192" } = body

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID", success: false }, { status: 400 })
    }

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required", success: false }, { status: 400 })
    }

    // Check if chat exists
    const chat = await Chat.findById(chatId).lean<IChat>()
    if (!chat) {
      return NextResponse.json({ error: "Chat not found", success: false }, { status: 404 })
    }

    // Save user message
    const userMessage = new Message({
      chatId,
      role: "user",
      content: content.trim(),
    })
    await userMessage.save()

    // Get conversation history for context
    const previousMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 }) // Get most recent messages first
      .limit(5) // Limit to last 5 messages to stay within token limits
      .lean<IMessage[]>()

    // Convert to LangChain message format
    const conversationHistory: BaseMessage[] = previousMessages
      .reverse() // Reverse to get chronological order
      .map((msg) =>
        msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content),
      )

    try {
      // Initialize model with selected model name
      const model = new ChatOpenAI({
        openAIApiKey: process.env.GROQ_API_KEY,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
        },
        modelName,
        maxTokens: 1000, // Limit response size
      })

      // Get AI response
      const response = await model.invoke(conversationHistory)

      // Save assistant response
      const assistantMessage = new Message({
        chatId,
        role: "assistant",
        content: response.content as string,
      })
      await assistantMessage.save()

      // Update chat title if it's the first message
      if (chat.title === "New Chat" && previousMessages.length === 1) {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "")
        await Chat.findByIdAndUpdate(chatId, { title: newTitle })
      }

      return NextResponse.json({
        userMessage: {
          id: userMessage._id.toString(),
          role: "user",
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        assistantMessage: {
          id: assistantMessage._id.toString(),
          role: "assistant",
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
        success: true,
      })
    } catch (error: any) {
      console.error("Error processing message:", error)
      
      // Handle token limit error specifically
      if (error.code === 'rate_limit_exceeded' || error.type === 'tokens') {
        return NextResponse.json({ 
          error: "Message too long. Please try a shorter message or wait a minute before trying again.", 
          success: false 
        }, { status: 413 })
      }
      
      return NextResponse.json({ error: "Failed to process message", success: false }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing message:", error)
    return NextResponse.json({ error: "Failed to process message", success: false }, { status: 500 })
  }
}
