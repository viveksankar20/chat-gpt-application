// OpenRouter provider abstraction (multi-provider aggregator)
// https://docs.openrouter.ai

declare const process: { env: Record<string, string | undefined> }

import type { ChatMessage } from '../providerRegistry'

export const openRouterService = {
  providerName: 'openrouter' as const,

  async generateResponse(prompt: string, modelId?: string, messages?: ChatMessage[]): Promise<string> {
    console.log('[openrouter.service] generateResponse start model:', modelId)

    const apiKey = process.env.OPENROUTER_API_KEY
    const model = modelId || 'text-davinci-002' // Example fallback

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return `OpenRouter mock [${model}]: ${prompt.slice(0, 280)}`
    }

    try {
      const apiMessages = messages && messages.length > 0
        ? [
            { role: 'system', content: 'You are a helpful AI assistant. Always format your responses using Markdown.' },
            ...messages
          ]
        : [
            { role: 'system', content: 'You are a helpful AI assistant. Always format your responses using Markdown. Use headings, bullet points, and code blocks with language tags where appropriate.' },
            { role: 'user', content: prompt }
          ]

      const response = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          max_tokens: 600,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`[openrouter.service] non-2xx: ${response.status} ${text}`)
      }

      const json = await response.json()
      const answer = json?.choices?.[0]?.message?.content

      if (!answer) {
        throw new Error('[openrouter.service] invalid response payload')
      }

      return answer
    } catch (error) {
      console.error('[openrouter.service] failed', error)
      throw error
    }
  },
}
