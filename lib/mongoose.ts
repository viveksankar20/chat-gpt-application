import mongoose from "mongoose";
const MONGO_URI="mongodb://localhost:27017/chatgpt"


if(!MONGO_URI){
    throw new Error("Please define the MONGO_URI environment variable inside .env.local");
}

let cached=(global as any).mongoose;
if(!cached){
    cached=(global as any).mongoose={conn:null,promise:null};
}

export async function connectDB(){
    if(cached.conn) return cached.conn;
    if(!cached.promise){
        cached.promise=mongoose.connect(MONGO_URI,{
            bufferCommands:false
        }).then((mongoose)=>{
            return mongoose;
        })
    }
cached.conn = await cached.promise;
  return cached.conn;
}