// Intent detection is isolated from model selection for single responsibility and easier unit tests.
export type IntentType = 'coding' | 'long_context' | 'creative' | 'general'

const codeKeywords = ['function', 'class', 'const', 'let', 'var', 'import', 'async', 'await', 'return', 'console', 'def', 'public', 'private', 'override']
const creativeKeywords = ['write', 'story', 'creative', 'imagine', 'compose']

export function detectIntent(prompt: string): IntentType {
  const trimmed = prompt?.trim().toLowerCase() ?? ''

  // Long context gets priority before other short phrase checks.
  if (trimmed.length > 500) {
    console.log('[intent.service] detected long_context from prompt length', trimmed.length)
    return 'long_context'
  }

  if (codeKeywords.some((keyword) => trimmed.includes(keyword))) {
    console.log('[intent.service] detected coding intent')
    return 'coding'
  }

  if (creativeKeywords.some((keyword) => trimmed.includes(keyword))) {
    console.log('[intent.service] detected creative intent')
    return 'creative'
  }

  console.log('[intent.service] detected general intent')
  return 'general'
}
