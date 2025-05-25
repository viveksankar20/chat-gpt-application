import { NextResponse } from 'next/server';
import ChatMessage from '../../../../chatMessage'; // Assuming chatMessage.js is at the project root
import mongoose from 'mongoose';

// Placeholder for MongoDB connection utility
// In a real app, this would be in a separate file e.g., lib/mongodb.js
async function connectToDatabase() {
  if (mongoose.connections[0].readyState) {
    // Use current db connection
    return;
  }
  // Use new db connection
  // Ensure MONGO_URI is set in your environment variables
  if (!process.env.MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
// Mock MONGO_URI for now if not set, for the sake of tool execution without .env
// In a real scenario, this should be handled by the environment.
if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = "mongodb://localhost:27017/chat_app_db_test";
}

/**
 * Placeholder function for AI interaction that includes chat history.
 * Logs the received data and returns a simulated response.
 */
async function getAIResponseWithHistory(currentUserMessageText, formattedHistory) {
  console.log("Current user message:", currentUserMessageText);
  console.log("Formatted history for AI:", JSON.stringify(formattedHistory, null, 2));

  // TODO: Replace this with your actual AI API call.
  // Example using OpenAI's SDK (ensure you have it installed and configured):
  //
  // import OpenAI from 'openai';
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  //
  // const messagesForAI = [
  //   ...formattedHistory,
  //   { role: 'user', content: currentUserMessageText }
  // ];
  //
  // try {
  //   const completion = await openai.chat.completions.create({
  //     messages: messagesForAI,
  //     model: 'gpt-3.5-turbo', // Or your preferred model
  //   });
  //   if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
  //     return completion.choices[0].message.content;
  //   } else {
  //     console.error("AI response format unexpected:", completion);
  //     return "AI Error: Could not process response.";
  //   }
  // } catch (error) {
  //   console.error("Error calling AI API:", error);
  //   return "AI Error: Exception during API call.";
  // }

  // For now, return a simulated response:
  return `AI (with history): Processed '${currentUserMessageText}'. History items: ${formattedHistory.length}`;
}

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { message, sessionId, userId } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields: message and sessionId' }, { status: 400 });
    }

    // Save User Message
    const userMessage = new ChatMessage({
      sessionId,
      userId: userId || null,
      sender: 'user',
      message,
    });
    await userMessage.save();

    // Fetch Recent History
    const historyLimit = 10; // Retrieve the last 10 messages
    const recentMessages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: -1 }) // Get the most recent messages first
      .limit(historyLimit)
      .exec();

    // Format History for AI (and reverse to chronological order for AI)
    const formattedHistory = recentMessages
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant', // Map 'sender' to 'role'
        content: msg.message, // Map 'message' to 'content'
      }))
      .reverse(); // Reverse to maintain chronological order (oldest to newest)

    // Call the AI with the current message and the formatted history
    const aiResponseText = await getAIResponseWithHistory(message, formattedHistory);

    // Save AI Response
    const aiMessage = new ChatMessage({
      sessionId,
      userId: userId || null,
      sender: 'ai',
      message: aiResponseText,
    });
    await aiMessage.save();

    return NextResponse.json({ aiResponse: aiResponseText }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message.includes('MONGO_URI')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Generic server error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
