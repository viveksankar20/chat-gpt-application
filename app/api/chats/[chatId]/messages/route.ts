import { NextRequest, NextResponse } from "next/server"
import { ChatService } from "@/lib/chat-service"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
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
    const body = await req.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      )
    }

    // Create user message
    const userMessage = await ChatService.createUserMessage(params.chatId, content)
    
    // Get AI response
    const assistantMessage = await ChatService.createAssistantMessage(params.chatId, content)

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
