import { NextRequest } from "next/server"
import { detectIntent } from "../../../../backend/services/intent.service"
import { getCapabilityForIntent } from "../../../../backend/services/modelSelector.service"
import { providerRegistry } from "../../../../backend/services/providerRegistry"
import { modelConfigs } from "../../../../backend/services/models.config"
import { rankResponses, ResponseItem } from "../../../../backend/services/ranking.service"

function selectModelsForCapability(capability: string, count: number = 3): Array<{ modelId: string; provider: string }> {
  // Get all free models with this capability, sorted by priority
  const candidates = modelConfigs
    .filter((m) => m.freeTier && m.capabilities.includes(capability as any))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count)

  return candidates.map((m) => ({ modelId: m.id, provider: m.provider }))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt = body.prompt?.toString()?.trim() ?? ""

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const intent = detectIntent(prompt)
    const capability = getCapabilityForIntent(intent)

    console.log('[api/ai/compare] intent:', intent, 'capability:', capability)

    // Select 2-3 best models for this capability
    const selectedModels = selectModelsForCapability(capability, 3)

    if (selectedModels.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No models available for this request" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log('[api/ai/compare] selected models:', selectedModels.map(m => `${m.provider}/${m.modelId}`))

    // Execute all requests in parallel with Promise.allSettled
    const startTime = Date.now()

    const promises = selectedModels.map(async ({ modelId, provider }) => {
      const modelStart = Date.now()
      try {
        const service = providerRegistry[provider]
        const response = await service.generateResponse(prompt, modelId)
        const timeMs = Date.now() - modelStart

        return {
          model: modelId,
          text: response,
          timeMs,
          status: 'fulfilled' as const,
        }
      } catch (error) {
        const timeMs = Date.now() - modelStart
        const message = error instanceof Error ? error.message : 'Unknown error'

        return {
          model: modelId,
          text: '',
          timeMs,
          status: 'rejected' as const,
          error: message,
        }
      }
    })

    const results = await Promise.allSettled(promises)
    const totalTime = Date.now() - startTime

    // Extract responses from results
    const responses: ResponseItem[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // This shouldn't happen with our error handling, but just in case
        return {
          model: selectedModels[index].modelId,
          text: '',
          timeMs: 0,
          status: 'rejected' as const,
          error: 'Promise rejected',
        }
      }
    })

    // Rank responses
    const rankedResponses = rankResponses(responses)

    console.log('[api/ai/compare] completed in', totalTime, 'ms')

    return new Response(JSON.stringify({
      success: true,
      data: {
        intent,
        capability,
        responses: rankedResponses,
        totalTimeMs: totalTime,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error('[api/ai/compare] error:', error)

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
