import mongoose, { Mongoose } from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

interface CachedMongoose {
  conn: Mongoose | null; // ✅ Fix: Mongoose instead of Connection
  promise: Promise<Mongoose> | null;
}

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable inside .env.local");
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
    cached!.promise = mongoose.connect(MONGO_URI||"", {
      bufferCommands: false,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
