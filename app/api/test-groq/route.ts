import { NextRequest, NextResponse } from "next/server"
import { streamGroqChatCompletion, type GroqChatMessage } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      message, 
      model = 'deepseek-r1-distill-llama-70b',
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = "You are a helpful AI assistant. When providing code, always provide the complete code without truncation. If the code is long, make sure to include all necessary parts including closing tags, brackets, and complete functions."
    } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      )
    }

    const messages: GroqChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    // Get streaming response
    const stream = await streamGroqChatCompletion({
      messages,
      model,
      temperature,
      maxTokens: Math.max(maxTokens, 4096),
      topP: 1,
      stop: null
    })

    // Collect the full response with timeout protection
    let fullResponse = ""
    let chunkCount = 0
    const maxChunks = 1000
    
    try {
      for await (const chunk of stream) {
        chunkCount++
        if (chunkCount > maxChunks) {
          console.warn("Reached maximum chunk limit, stopping stream")
          break
        }
        
        const content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
        
        // Check if response seems complete (ends with common code endings)
        if (content && (
          fullResponse.trim().endsWith('</html>') ||
          fullResponse.trim().endsWith('</body>') ||
          fullResponse.trim().endsWith('}') ||
          fullResponse.trim().endsWith('</script>') ||
          fullResponse.trim().endsWith('```') ||
          fullResponse.trim().endsWith('</div>')
        )) {
          // Wait a bit more to ensure we get the complete response
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (streamError) {
      console.error("Error during stream processing:", streamError)
      // Continue with partial response if available
    }

    // If response is still incomplete, try to detect and handle
    if (fullResponse && !fullResponse.trim().endsWith('</html>') && fullResponse.includes('<!DOCTYPE html>')) {
      // Try to complete HTML if it's cut off
      if (!fullResponse.includes('</body>')) {
        fullResponse += '\n</body>\n</html>'
      }
    }

    return NextResponse.json({
      success: true,
      response: fullResponse,
      model,
      temperature,
      maxTokens: Math.max(maxTokens, 4096),
      inputMessage: message,
      systemPrompt,
      chunkCount,
      responseLength: fullResponse.length
    })

  } catch (error) {
    console.error("Error testing GROQ API:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get GROQ response",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 