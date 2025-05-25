import { NextResponse } from 'next/server';
import ChatMessage from '../../../../../chatMessage'; // Assuming chatMessage.js is at the project root
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

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId'); // Optional

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing required query parameter: sessionId' }, { status: 400 });
    }

    const query = { sessionId };
    if (userId) {
      query.userId = userId;
    }

    const messages = await ChatMessage.find(query).sort({ timestamp: 'asc' }).exec();

    return NextResponse.json(messages, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/chat/history:', error);
    if (error.message.includes('MONGO_URI')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Generic server error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
