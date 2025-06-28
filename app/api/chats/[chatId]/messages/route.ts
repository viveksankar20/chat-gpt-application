import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ChatService } from "@/lib/chat-service"
import { connectDB } from "@/lib/mongoose"
import { Chat } from "@/models/chat.model"
import { authOptions } from "../../../auth/[...nextauth]/route"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    // Check if the chat belongs to the authenticated user
    const chat = await Chat.findById(params.chatId)
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const messages = await ChatService.getMessages(params.chatId)
    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    // Check if the chat belongs to the authenticated user
    const chat = await Chat.findById(params.chatId)
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      )
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { content, model } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      )
    }

    // Create user message
    const userMessage = await ChatService.createUserMessage(params.chatId, content)
    
    // Get AI response
    const assistantMessage = await ChatService.createAssistantMessage(params.chatId, content, model)

    return NextResponse.json({
      success: true,
      userMessage,
      assistantMessage
    })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create message" },
      { status: 500 }
    )
  }
}
