// Groq provider abstraction.
// Add typing for process.env in environments where Node types are not globally injected.
declare const process: { env: Record<string, string | undefined> }

import type { ChatMessage } from '../providerRegistry'

const SYSTEM_PROMPT = `You are a highly capable AI assistant. 
Always format your responses using professional Markdown to ensure maximum clarity and readability.
Follow these formatting rules strictly:
1. Use # for the main title and ## or ### for subsections.
2. Use **bold** for key terms and emphasis.
3. Use bullet points or numbered lists for steps, features, or items.
4. For code snippets, ALWAYS specify the language tag (e.g., \`\`\`typescript).
5. Use tables for comparisons or structured data.
6. Use blockquotes for important notes or warnings.
7. Ensure proper spacing between paragraphs and sections with blank lines.`

export const groqService = {
  providerName: 'groq' as const,

  async generateResponse(prompt: string, modelId?: string, messages?: ChatMessage[]): Promise<string> {
    console.log('[groq.service] generateResponse start, model:', modelId || 'default')

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        // Build messages array: if history provided use it, otherwise fall back to single user message
        const apiMessages = messages && messages.length > 0
          ? [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
          : [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ]

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId || 'llama-3.3-70b-versatile',
            messages: apiMessages,
            max_tokens: 1024,
            temperature: 0.7
          })
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`[groq.service] non-2xx response: ${response.status} ${text}`)
        }

        const json = await response.json()
        const answer = json?.choices?.[0]?.message?.content as string
        if (!answer) {
          throw new Error('[groq.service] invalid response payload')
        }

        console.log('[groq.service] generateResponse finished (real API)')
        return answer
      } catch (error) {
        console.error('[groq.service] external API failed', error)
        throw error
      }
    }

    // Fallback mock behavior if API keys not configured.
    await new Promise((resolve) => setTimeout(resolve, 150))
    const mock = `Groq mock response for intent-aware prompt: ${prompt.slice(0, 300)}`
    console.log('[groq.service] generateResponse finished (mock)')
    return mock
  },
  
  async generateStream(prompt: string, modelId?: string, messages?: ChatMessage[]): Promise<ReadableStream<string>> {
    console.log('[groq.service] generateStream start, model:', modelId || 'default')
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('[groq.service] API key not configured for streaming')
    }

    // Build messages array with conversation history
    const apiMessages = messages && messages.length > 0
      ? [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
      : [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId || 'llama-3.3-70b-versatile',
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`[groq.service] streaming failed: ${response.status} ${text}`)
    }

    const decoder = new TextDecoder()
    
    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue
              
              const data = trimmed.slice(6)
              if (data === '[DONE]') {
                controller.close()
                return
              }

              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(content)
                }
              } catch (e) {
                console.warn('[groq.service] Error parsing stream chunk', e)
              }
            }
          }
        } catch (e) {
          controller.error(e)
        } finally {
          controller.close()
        }
      }
    })
  }
}
