// Simple ranking service for AI responses.
// Ranks based on length, structure, and response time.
export interface ResponseItem {
  model: string
  text: string
  timeMs: number
  status: 'fulfilled' | 'rejected'
  error?: string
}

export interface RankedResponse extends ResponseItem {
  score: number
  rank: number
  isBest: boolean
}

function calculateScore(response: ResponseItem): number {
  if (response.status === 'rejected') return 0

  let score = 0

  // Length score (prefer substantial responses)
  const length = response.text.length
  if (length > 100) score += 20
  if (length > 500) score += 20
  if (length > 1000) score += 10

  // Structure score (prefer organized content)
  const hasLists = response.text.includes('- ') || response.text.includes('•')
  const hasCode = response.text.includes('```') || response.text.includes('function') || response.text.includes('const ')
  const hasNumbers = /\d+\./.test(response.text)

  if (hasLists) score += 15
  if (hasCode) score += 15
  if (hasNumbers) score += 10

  // Time score (prefer faster responses, but not too much)
  const timeBonus = Math.max(0, 20 - (response.timeMs / 100)) // up to 20 points for fast responses
  score += timeBonus

  return Math.round(score)
}

export function rankResponses(responses: ResponseItem[]): RankedResponse[] {
  // Calculate scores
  const withScores = responses.map((response) => ({
    ...response,
    score: calculateScore(response),
  }))

  // Sort by score descending
  withScores.sort((a, b) => b.score - a.score)

  // Assign ranks and mark best
  const ranked = withScores.map((response, index) => ({
    ...response,
    rank: index + 1,
    isBest: index === 0,
  }))

  return ranked
}
