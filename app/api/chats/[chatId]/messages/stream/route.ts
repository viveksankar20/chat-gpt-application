import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ChatService } from "@/lib/chat-service"
import { connectDB } from "@/lib/mongoose"
import { Chat, Message } from "@/models/chat.model"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { orchestrateStream } from "@/backend/services/orchestrator.service"

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session: any = await getServerSession(authOptions as any)
    
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

    // Save user message
    const userMessage = await ChatService.createUserMessage(params.chatId, content)

    // Build history
    const recentDesc = await Message.find({ chatId: params.chatId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    // Reverse to chronological order
    const chronological = recentDesc.slice().reverse()
    const messages = chronological.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string
    }))

    // Get AI Stream
    const { stream, isCached } = await orchestrateStream(content, {
      modelId: model,
      mode: model ? 'advanced' : 'smart',
      messages
    })

    // Intercept the stream to save the assistant message when it's done
    let fullResponse = ""
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        fullResponse += chunk;
        controller.enqueue(chunk);
      },
      flush(controller) {
        // Save the full response asynchronously
        // Remove <think> tags if any
        const cleanContent = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        
        const assistantMessage = new Message({
          chatId: params.chatId,
          role: "assistant",
          content: cleanContent
        })
        assistantMessage.save().catch((e: any) => console.error("Failed to save assistant stream message", e))
        
        Chat.findByIdAndUpdate(params.chatId, { updatedAt: new Date() }).catch((e: any) => console.error("Failed to update chat updatedAt", e))
      }
    })

    const finalStream = stream.pipeThrough(transformStream)

    // Return the user message ID in headers so the client can display it immediately
    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-User-Message-Id': userMessage.id,
      'X-User-Message-CreatedAt': userMessage.createdAt,
      'X-Is-Cached': isCached ? 'true' : 'false'
    })

    return new NextResponse(finalStream, { headers: responseHeaders })

  } catch (error) {
    console.error("Error creating message stream:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create message stream" },
      { status: 500 }
    )
  }
}
