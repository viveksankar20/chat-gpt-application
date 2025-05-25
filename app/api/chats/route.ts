import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat } from "@/models/chat.model"
import type { ChatResponse } from "@/types/chat"

// GET all chats
export async function GET(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    await connectDB()

    const userId = req.nextUrl.searchParams.get("userId") || "default-user"

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean<IChat[]>()

    // Get message count for each chat
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

    return NextResponse.json({
      chats: chatsWithMessageCount,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json({ error: "Failed to fetch chats", success: false }, { status: 500 })
  }
}

// POST - Create new chat
export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    await connectDB()

    const body = await req.json()
    const { title, userId = "default-user" } = body

    const newChat = new Chat({
      title: title || "New Chat",
      userId,
    })

    await newChat.save()

    return NextResponse.json({
      chat: {
        id: newChat._id.toString(),
        title: newChat.title,
        createdAt: newChat.createdAt.toISOString(),
        updatedAt: newChat.updatedAt.toISOString(),
        messageCount: 0,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json({ error: "Failed to create chat", success: false }, { status: 500 })
  }
}
