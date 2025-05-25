import mongoose, { Mongoose, Connection } from "mongoose";
const MONGO_URI="mongodb://localhost:27017/chatgpt"

interface CachedMongoose {
  conn: Connection | null;
  promise: Promise<Mongoose> | null;
}

if(!MONGO_URI){
    throw new Error("Please define the MONGO_URI environment variable inside .env.local");
}

let cached = (global as typeof globalThis & { mongoose: CachedMongoose | undefined }).mongoose;
if(!cached){
    cached = (global as typeof globalThis & { mongoose: CachedMongoose | undefined }).mongoose = { conn: null, promise: null };
}

export async function connectDB(){
    if(cached!.conn) return cached!.conn;
    if(!cached!.promise){
        cached!.promise=mongoose.connect(MONGO_URI,{
            bufferCommands:false
        }).then((mongooseInstance)=>{ // Renamed mongoose to mongooseInstance to avoid conflict
            return mongooseInstance;
        })
    }
cached!.conn = await cached!.promise;
  return cached!.conn;
}