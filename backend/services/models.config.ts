import { ProviderName } from './modelSelector.service'

export type Capability = 'chat' | 'code' | 'creative' | 'long-context'

export interface ModelConfig {
  id: string
  name: string
  provider: ProviderName
  freeTier: boolean
  capabilities: Capability[]
  tags: string[]
  priority: number
}

export const modelConfigs: ModelConfig[] = [
  // Groq models - using REAL Groq API model IDs
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Versatile)',
    provider: 'groq',
    freeTier: true,
    capabilities: ['chat', 'code', 'creative'],
    tags: ['Fast', 'Production'],
    priority: 100,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Instant)',
    provider: 'groq',
    freeTier: true,
    capabilities: ['chat', 'code'],
    tags: ['Very Fast'],
    priority: 95,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout (17B)',
    provider: 'groq',
    freeTier: true,
    capabilities: ['chat', 'code', 'creative'],
    tags: ['Groq', 'Latest'],
    priority: 98,
  },
  // Gemini models — real API if GEMINI_API_KEY is set, otherwise orchestrator failover skips them
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    freeTier: true,
    capabilities: ['long-context', 'creative', 'chat'],
    tags: ['Long-context', 'Free tier'],
    priority: 30,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    freeTier: true,
    capabilities: ['long-context', 'creative', 'code'],
    tags: ['Best for long-context', 'Free tier'],
    priority: 25,
  },
  {
    id: 'hf-mistral-7b-instruct',
    name: 'HuggingFace Mistral-7B-Instruct',
    provider: 'huggingface',
    freeTier: true,
    capabilities: ['creative', 'chat'],
    tags: ['Community', 'Flexible'],
    priority: 50,
  },
  {
    id: 'hf-llama-3',
    name: 'HuggingFace Llama-3',
    provider: 'huggingface',
    freeTier: true,
    capabilities: ['chat', 'code', 'creative'],
    tags: ['Large context', 'Community'],
    priority: 55,
  },
  {
    id: 'together-mixtral',
    name: 'Together Mixtral',
    provider: 'together',
    freeTier: true,
    capabilities: ['creative', 'chat'],
    tags: ['Creative', 'Fast'],
    priority: 45,
  },
  {
    id: 'together-llama',
    name: 'Together LLaMA',
    provider: 'together',
    freeTier: true,
    capabilities: ['code', 'chat'],
    tags: ['Code', 'Stable'],
    priority: 40,
  },
  {
    id: 'openrouter-fallback',
    name: 'OpenRouter Fallback',
    provider: 'openrouter',
    freeTier: true,
    capabilities: ['chat', 'code', 'creative', 'long-context'],
    tags: ['Fallback', 'Multi-provider'],
    priority: 30,
  },
]

export const freeModelConfigs = modelConfigs.filter((m) => m.freeTier)
