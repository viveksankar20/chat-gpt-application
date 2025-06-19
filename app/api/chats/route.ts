import { NextRequest, NextResponse } from "next/server"
import { ChatService } from "@/lib/chat-service"

// GET all chats
export async function GET() {
  try {
    const chats = await ChatService.getChats()
    return NextResponse.json({ success: true, chats })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}

// POST - Create new chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title = "New Chat" } = body

    const chat = await ChatService.createChat(title)
    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
