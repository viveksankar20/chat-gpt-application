import { NextRequest, NextResponse } from "next/server"
import { ChatOpenAI } from "@langchain/openai"
import { connectToDatabase } from '@/lib/mongodb'
import { Message } from '@/lib/models/message'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageResponse {
  messages?: Message[];
  error?: string;
  success: boolean;
}

interface RouteParams {
  params: {
    chatId: string;
  };
}

// Initialize the model outside of the route handlers
let model: ChatOpenAI;

try {
  model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
  });
} catch (error) {
  console.error("Error initializing ChatOpenAI:", error);
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<MessageResponse>> {
  try {
    const connection = await connectToDatabase();
    if (!connection) {
      throw new Error("Failed to connect to database");
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required", success: false },
        { status: 400 }
      );
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", success: false },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<MessageResponse>> {
  try {
    if (!model) {
      throw new Error("ChatOpenAI model not initialized");
    }

    const body = await req.json();
    const connection = await connectToDatabase();
    if (!connection) {
      throw new Error("Failed to connect to database");
    }

    const { chatId } = params;
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required", success: false },
        { status: 400 }
      );
    }

    // Save user message
    const userMessage = new Message({
      chatId,
      role: "user",
      content,
    });
    await userMessage.save();

    // Get conversation history for context
    const previousMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Convert to LangChain message format
    const langchainMessages = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get AI response
    const response = await model.invoke(langchainMessages);

    if (response) {
      // Save assistant response
      const assistantMessage = new Message({
        chatId,
        role: "assistant",
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      });
      await assistantMessage.save();

      return NextResponse.json({
        messages: [
          { role: "user", content },
          { role: "assistant", content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content) },
        ],
        success: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to get AI response", success: false },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message", success: false },
      { status: 500 }
    );
  }
}
