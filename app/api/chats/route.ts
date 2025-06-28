import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ChatService } from "@/lib/chat-service"
import { authOptions } from "../auth/[...nextauth]/route"
import type { AuthOptions } from "next-auth"

// GET all chats for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions as AuthOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const chats = await ChatService.getChatsByUserId(session.user.id)
    return NextResponse.json({ success: true, chats })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}

// POST - Create new chat for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as AuthOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title = "New Chat" } = body

    const chat = await ChatService.createChat(title, session.user.id)
    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
