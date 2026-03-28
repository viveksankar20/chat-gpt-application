import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { Message, Chat, type IMessage } from "@/models/chat.model"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

interface RouteParams {
  params: {
    messageId: string
  }
}

// PUT - Edit a message
export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { messageId } = params
    const body = await req.json()
    const { content } = body

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid message ID", success: false }, { status: 400 })
    }

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required", success: false }, { status: 400 })
    }

    // Security check: Verify the message belongs to a chat owned by the user
    const messageToUpdate = await Message.findById(messageId).lean<IMessage>()
    if (!messageToUpdate) {
      return NextResponse.json({ error: "Message not found", success: false }, { status: 404 })
    }

    const chat = await Chat.findById(messageToUpdate.chatId).lean<any>()
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 403 })
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { content: content.trim() },
      { new: true },
    ).lean<IMessage>()

    if (!updatedMessage) {
      return NextResponse.json({ error: "Message not found", success: false }, { status: 404 })
    }

    return NextResponse.json({
      message: {
        id: updatedMessage._id.toString(),
        role: updatedMessage.role,
        content: updatedMessage.content,
        createdAt: updatedMessage.createdAt.toISOString(),
      },
      success: true,
    })
  } catch (error) {
    console.error("Error updating message:", error)
    return NextResponse.json({ error: "Failed to update message", success: false }, { status: 500 })
  }
}

// DELETE a message
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { messageId } = params

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ message: "Invalid message ID", success: false }, { status: 400 })
    }

    // Security check
    const messageToDelete = await Message.findById(messageId).lean<IMessage>()
    if (!messageToDelete) {
      return NextResponse.json({ message: "Message not found", success: false }, { status: 404 })
    }

    const chat = await Chat.findById(messageToDelete.chatId).lean<any>()
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized", success: false }, { status: 403 })
    }

    const deletedMessage = await Message.findByIdAndDelete(messageId)

    if (!deletedMessage) {
      return NextResponse.json({ message: "Message not found", success: false }, { status: 404 })
    }

    return NextResponse.json({
      message: "Message deleted successfully",
      success: true,
    })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json({ message: "Failed to delete message", success: false }, { status: 500 })
  }
}
