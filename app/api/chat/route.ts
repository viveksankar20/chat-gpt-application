import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system:
      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When providing code examples, use proper formatting and explain the code when helpful.",
  })

  return result.toDataStreamResponse()
}
