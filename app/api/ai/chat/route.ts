import { NextRequest } from "next/server"
import { orchestrate, orchestrateStream } from "../../../../backend/services/orchestrator.service"

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

import { rateLimiterMiddleware } from "../../../../backend/middlewares/rateLimiter"

export async function POST(req: NextRequest) {
  try {
    // Feature 3 & 8: API Rate Limiting and Hardening
    const rateLimitResponse = await rateLimiterMiddleware(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }

    const body = await req.json()
    const prompt = body.prompt?.toString()?.trim() ?? ""
    const modelId = body.modelId?.toString()

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 })
    }

    const orchestratorResult = await orchestrateStream(prompt, { modelId, mode: modelId ? 'advanced' : 'smart' })
    const aiStream = orchestratorResult.stream

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata event first for usage tracking and UX display.
        controller.enqueue(
          encoder.encode(
            `event: metadata\ndata: ${JSON.stringify({ 
              provider: orchestratorResult.provider, 
              modelId: orchestratorResult.modelId,
              isCached: orchestratorResult.isCached
            })}\n\n`
          )
        )

        const reader = aiStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Send each token as a data chunk. 
            // We split by newline to ensure SSE format is respected (data: line\n)
            const lines = value.split('\n')
            for (let i = 0; i < lines.length; i++) {
              controller.enqueue(encoder.encode(`data: ${lines[i]}\n`))
              if (i < lines.length - 1) {
                // If it was a real newline in the AI response, we need an extra \n to separate SSE messages or just let it be
                // SSE data: chunk1\ndata: chunk2\n\n means chunk1\nchunk2
                // Actually, ChatContainer.tsx joins with "" so we just need to send data: text\n\n
              }
            }
            controller.enqueue(encoder.encode(`\n`)) // End of this SSE message
          }
        } catch (e) {
          console.error("Stream reading error", e)
          controller.enqueue(encoder.encode(`event: error\ndata: ${e instanceof Error ? e.message : "Stream error"}\n\n`))
        }

        // Then signal done
        controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${message}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  }
}
