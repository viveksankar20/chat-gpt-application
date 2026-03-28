import { ProviderName } from './modelSelector.service'
import { groqService } from './providers/groq.service'
import { geminiService } from './providers/gemini.service'
import { togetherService } from './providers/together.service'
import { huggingFaceService } from './providers/huggingface.service'
import { openRouterService } from './providers/openrouter.service'

export interface ProviderService {
  providerName: ProviderName
  generateResponse: (prompt: string, modelId?: string) => Promise<string>
  generateStream?: (prompt: string, modelId?: string) => Promise<ReadableStream<string>>
}

export const providerRegistry: Record<ProviderName, ProviderService> = {
  groq: groqService,
  gemini: geminiService,
  together: togetherService,
  huggingface: huggingFaceService,
  openrouter: openRouterService,
}

export const providerOrder: ProviderName[] = ['groq', 'gemini', 'together', 'openrouter', 'huggingface']
