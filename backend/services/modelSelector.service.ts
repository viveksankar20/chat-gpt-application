import { IntentType } from './intent.service'

// Provider names are normalized for orchestrator/fallback logic.
export type ProviderName = 'groq' | 'gemini' | 'together' | 'huggingface' | 'openrouter'

export function getCapabilityForIntent(intent: IntentType) {
  switch (intent) {
    case 'coding':
      return 'code'
    case 'long_context':
      return 'long-context'
    case 'creative':
      return 'creative'
    case 'general':
    default:
      return 'chat'
  }
}
