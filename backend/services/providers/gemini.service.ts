import { type NextRequest, NextResponse } from "next/server"

// Gemini provider abstraction.
declare const process: { env: Record<string, string | undefined> }

export const geminiService = {
  providerName: 'gemini' as const,

  async generateResponse(prompt: string, modelId?: string): Promise<string> {
    const model = modelId || 'gemini-1.5-flash'
    console.log('[gemini.service] generateResponse start, model:', model)

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `You are a highly capable AI assistant. 
Always format your responses using professional Markdown to ensure maximum clarity and readability.
Follow these formatting rules strictly:
1. Use # for the main title and ## or ### for subsections.
2. Use **bold** for key terms and emphasis.
3. Use bullet points or numbered lists for steps, features, or items.
4. For code snippets, ALWAYS specify the language tag (e.g., \`\`\`typescript).
5. Use tables for comparisons or structured data.
6. Use blockquotes for important notes or warnings.
7. Ensure proper spacing between paragraphs and sections with blank lines.

User Request: ${prompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          })
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`[gemini.service] non-2xx response: ${response.status} ${text}`)
        }

        const json = await response.json()
        const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text as string
        if (!answer) {
          throw new Error('[gemini.service] invalid response payload')
        }

        console.log('[gemini.service] generateResponse finished (real API)')
        return answer
      } catch (error) {
        console.error('[gemini.service] external Gemini call failed', error)
        throw error
      }
    }

    // No API key — throw so the orchestrator failover routes to Groq instead
    console.warn('[gemini.service] No GEMINI_API_KEY found — skipping Gemini, triggering failover')
    throw new Error('[gemini.service] GEMINI_API_KEY not configured')
  }
}
