import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, AIMessage, type BaseMessage } from "@langchain/core/messages"
import mongoose from "mongoose"
import type { MessageResponse } from "@/types/chat"

// Initialize model outside handlers to avoid re-instantiating on every request
const apiKey = process.env.GROQ_API_KEY
if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY in environment variables")
}
const model = new ChatOpenAI({
  openAIApiKey: apiKey,
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

// GET handler
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

    return NextResponse.json({ messages: formattedMessages, success: true })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages", success: false }, { status: 500 })
  }
}

// POST handler
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse<MessageResponse>> {
  try {
    await connectDB()

    const { chatId } = params
    const body = await req.json()
    const { content } = body

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID", success: false }, { status: 400 })
    }
    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required", success: false }, { status: 400 })
    }

    const chat = await Chat.findById(chatId).lean<IChat>()
    if (!chat) {
      return NextResponse.json({ error: "Chat not found", success: false }, { status: 404 })
    }

    const userMessage = new Message({ chatId, role: "user", content: content.trim() })
    await userMessage.save()

    const previousMessages = await Message.find({ chatId }).sort({ createdAt: 1 }).limit(20).lean<IMessage[]>()
    const conversationHistory: BaseMessage[] = previousMessages.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    )

    // Wrap model invocation with try-catch
    let response
    try {
      response = await model.invoke(conversationHistory)
    } catch (aiError) {
      console.error("AI model invocation error:", aiError)
      return NextResponse.json({ error: "AI service error", success: false }, { status: 500 })
    }

    const assistantMessage = new Message({
      chatId,
      role: "assistant",
      content: response.content as string,
    })
    await assistantMessage.save()

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
  } catch (error) {
    console.error("Error processing message:", error)
    return NextResponse.json({ error: "Failed to process message", success: false }, { status: 500 })
  }
}
