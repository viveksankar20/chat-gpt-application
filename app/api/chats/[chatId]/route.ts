import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { Chat, Message, type IChat, type IMessage } from "@/models/chat.model"
import mongoose from "mongoose"
import type { ChatResponse, MessageResponse } from "@/types/chat"

interface RouteParams {
  params: {
    chatId: string
  }
}

// GET specific chat with messages
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ChatResponse & MessageResponse>> {
  try {
    await connectDB()

    const { chatId } = params

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID", success: false }, { status: 400 })
    }

    const chat = await Chat.findById(chatId).lean<IChat>()
    if (!chat) {
      return NextResponse.json({ error: "Chat not found", success: false }, { status: 404 })
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean<IMessage[]>()

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: messages.length,
      },
      messages: formattedMessages,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat", success: false }, { status: 500 })
  }
}

// PUT - Update chat (mainly for title)
export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse<ChatResponse>> {
  try {
    await connectDB()

    const { chatId } = params
    const body = await req.json()
    const { title } = body

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID", success: false }, { status: 400 })
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { title, updatedAt: new Date() },
      { new: true },
    ).lean<IChat>()

    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found", success: false }, { status: 404 })
    }

    return NextResponse.json({
      chat: {
        id: updatedChat._id.toString(),
        title: updatedChat.title,
        createdAt: updatedChat.createdAt.toISOString(),
        updatedAt: updatedChat.updatedAt.toISOString(),
        messageCount: 0,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error updating chat:", error)
    return NextResponse.json({ error: "Failed to update chat", success: false }, { status: 500 })
  }
}

// DELETE chat and all its messages
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ message: string; success: boolean }>> {
  try {
    await connectDB()

    const { chatId } = params

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ message: "Invalid chat ID", success: false }, { status: 400 })
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId })

    // Delete the chat
    const deletedChat = await Chat.findByIdAndDelete(chatId)

    if (!deletedChat) {
      return NextResponse.json({ message: "Chat not found", success: false }, { status: 404 })
    }

    return NextResponse.json({
      message: "Chat deleted successfully",
      success: true,
    })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json({ message: "Failed to delete chat", success: false }, { status: 500 })
  }
}
