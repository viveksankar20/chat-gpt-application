export type Capability = 'chat' | 'code' | 'creative' | 'long-context'

export interface ModelOption {
  id: string
  name: string
  provider: string
  tags: string[]
  capabilities: Capability[]
  label: string
}

export const modelOptions: ModelOption[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', tags: ['Fast', 'Best for Code'], capabilities: ['chat', 'code', 'creative'], label: 'Fast' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq', tags: ['Very Fast'], capabilities: ['code', 'chat'], label: 'Instant' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', tags: ['Long-context'], capabilities: ['long-context', 'creative', 'chat'], label: 'Long-context' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini', tags: ['Premium', 'Long-context'], capabilities: ['long-context', 'creative', 'code'], label: 'Long-context' },
  { id: 'hf-mistral-7b-instruct', name: 'HuggingFace Mistral 7B Instruct', provider: 'huggingface', tags: ['Community'], capabilities: ['creative', 'chat'], label: 'Creative' },
  { id: 'hf-llama-3', name: 'HuggingFace Llama 3', provider: 'huggingface', tags: ['Community'], capabilities: ['chat', 'code', 'creative'], label: 'Chat' },
  { id: 'together-mixtral', name: 'Together Mixtral', provider: 'together', tags: ['Creative'], capabilities: ['creative', 'chat'], label: 'Creative' },
  { id: 'together-llama', name: 'Together LLaMA', provider: 'together', tags: ['Code'], capabilities: ['code', 'chat'], label: 'Code' },
  { id: 'openrouter-fallback', name: 'OpenRouter Fallback', provider: 'openrouter', tags: ['Fallback', 'Multi'], capabilities: ['chat', 'code', 'creative', 'long-context'], label: 'Fallback' },
]
