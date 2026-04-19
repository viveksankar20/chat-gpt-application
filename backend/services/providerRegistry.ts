import { ProviderName } from './modelSelector.service'
import { groqService } from './providers/groq.service'
import { geminiService } from './providers/gemini.service'
import { togetherService } from './providers/together.service'
import { huggingFaceService } from './providers/huggingface.service'
import { openRouterService } from './providers/openrouter.service'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ProviderService {
  providerName: ProviderName
  generateResponse: (prompt: string, modelId?: string, messages?: ChatMessage[]) => Promise<string>
  generateStream?: (prompt: string, modelId?: string, messages?: ChatMessage[]) => Promise<ReadableStream<string>>
}

export const providerRegistry: Record<ProviderName, ProviderService> = {
  groq: groqService,
  gemini: geminiService,
  together: togetherService,
  huggingface: huggingFaceService,
  openrouter: openRouterService,
}

export const providerOrder: ProviderName[] = ['groq', 'gemini', 'together', 'openrouter', 'huggingface']
