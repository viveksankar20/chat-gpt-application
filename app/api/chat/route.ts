import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Message from "@/models/chat.model"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"

const model = new ChatOpenAI({
  openAIApiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1",
  },
  modelName: "llama3-8b-8192",
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const query = req.nextUrl.searchParams.get("query")
    if (!query) {
      return NextResponse.json({ message: "Please provide a query" }, { status: 400 })
    }

    const response = await model.call([new HumanMessage(query)])

    // Save user message
    await new Message({
      query,
      response: null,
      content: query,
    }).save()

    // Save assistant response
    await new Message({
      query,
      response: response.text,
      content: response.text,
    }).save()

    const messages = await Message.find()
    return NextResponse.json({ message: messages, success: true })
  } catch (error) {
    console.error("MongoDB connection error:", error)
    return NextResponse.json({ error: "MongoDB connection failed" }, { status: 500 })
  }
}
