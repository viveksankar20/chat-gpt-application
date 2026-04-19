// Together provider is used for creative paths (Mixtral style).
// Add typing for process.env in environments where Node types are not globally injected.
declare const process: { env: Record<string, string | undefined> }

import type { ChatMessage } from '../providerRegistry'

export const togetherService = {
  providerName: 'together' as const,

  async generateResponse(prompt: string, modelId?: string, messages?: ChatMessage[]): Promise<string> {
    const model = modelId || 'mixtral'
    console.log('[together.service] generateResponse start, model:', model)

    if (process.env.TOGETHER_API_KEY) {
      try {
        // TODO: Replace with the real Together AI call as soon as available.
        await new Promise((resolve) => setTimeout(resolve, 70))
        const lastUserMsg = messages && messages.length > 0
          ? messages[messages.length - 1].content
          : prompt
        const answer = `Together placeholder response for prompt: ${lastUserMsg.slice(0, 220)}`
        console.log('[together.service] generateResponse finished (real placeholder)')
        return answer
      } catch (error) {
        console.error('[together.service] external Together call failed', error)
        throw error
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 170))
    const mock = `Together mock response [${model}] for prompt: ${prompt.slice(0, 200)}`
    console.log('[together.service] generateResponse finished (mock)')
    return mock
  }
}
