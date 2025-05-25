import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface CachedMongoose {
  conn: Mongoose | null; // ✅ Fix: Mongoose instead of Connection
  promise: Promise<Mongoose> | null;
}

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as typeof globalThis & { mongoose?: CachedMongoose }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose?: CachedMongoose }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached && cached.conn) return cached.conn;

  if (!cached?.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI||"", {
      bufferCommands: false,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
