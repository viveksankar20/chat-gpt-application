import { NextResponse } from 'next/server';
import { EcommerceService } from '@/backend/services/ecommerce.service';
import { orchestrate } from '@/backend/services/orchestrator.service';
import { ChatService } from '@/lib/chat-service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongoose";
import { Chat } from "@/models/chat.model";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { query, chatId } = await req.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json({ success: false, error: 'chatId is required to save history' }, { status: 400 });
    }

    await connectDB();
    const chat = await Chat.findById(chatId);
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Chat not found or Unauthorized" }, { status: 403 });
    }

    // Use AI to extract the core product search intent, fix spelling, and translate conversational modifiers
    const systemPrompt = `Extract the core e-commerce product search intent from this user query. Fix any spelling mistakes (e.g. "moblie" -> "mobile"). If they ask for things like "low cost", translate it into standard shopping modifiers like "cheap". Output ONLY the clean search query string without any quotes, preambles, or explanation. Query: "${query}"`;
    
    let cleanQuery = query;
    try {
      const orchestratorResult = await orchestrate(systemPrompt, { mode: 'smart' });
      if (orchestratorResult?.response) {
        cleanQuery = orchestratorResult.response.trim().replace(/^["']|["']$/g, '');
      }
    } catch (e) {
      console.error('Failed to clean query with AI, using original:', e);
    }

    const products = await EcommerceService.searchProducts(cleanQuery);

    // Save history
    const userMessage = await ChatService.createUserMessage(chatId, query);
    const assistantMessage = await ChatService.createMetadataMessage(chatId, 'assistant', '', 'ecommerce', { products });

    return NextResponse.json({
      success: true,
      data: products,
      userMessage,
      assistantMessage
    });
  } catch (error: any) {
    console.error('Ecommerce API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ecommerce data' },
      { status: 500 }
    );
  }
}
