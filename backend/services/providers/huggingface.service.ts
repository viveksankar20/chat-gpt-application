// HuggingFace Inference API provider abstraction.
// https://huggingface.co/docs/api-inference/index

declare const process: { env: Record<string, string | undefined> }

export const huggingFaceService = {
  providerName: 'huggingface' as const,

  async generateResponse(prompt: string, modelId?: string): Promise<string> {
    console.log('[huggingface.service] generateResponse start model:', modelId)

    const apiKey = process.env.HUGGINGFACE_API_KEY
    const model = modelId || 'mistralai/Mistral-7B-Instruct'

    if (!apiKey) {
      // Fallback mock
      await new Promise((resolve) => setTimeout(resolve, 120))
      return `HuggingFace mock [${model}]: ${prompt.slice(0, 280)}`
    }

    const url = `https://api-inference.huggingface.co/models/${model}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`[huggingface.service] status: ${res.status} ${text}`)
      }

      const json = await res.json()
      if (typeof json === 'string') {
        return json
      }

      // inference response may be an array of results, we merge text.
      if (Array.isArray(json) && json[0]?.generated_text) {
        return json[0].generated_text
      }

      throw new Error('[huggingface.service] unexpected response shape')
    } catch (error) {
      console.error('[huggingface.service] failed', error)
      throw error
    }
  },
}
