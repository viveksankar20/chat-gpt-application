import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ThumbsUp, ThumbsDown, Clock, Trophy, AlertCircle, Copy, Check } from 'lucide-react'

interface CompareResponse {
  model: string
  text: string
  timeMs: number
  status: 'fulfilled' | 'rejected'
  error?: string
  rank?: number
  score?: number
}

interface CompareViewProps {
  responses: CompareResponse[]
  onFeedback?: (model: string, feedback: 'like' | 'dislike') => void
  isLoading?: boolean
}

export function CompareView({ responses, onFeedback, isLoading }: CompareViewProps) {
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const handleFeedback = (model: string, type: 'like' | 'dislike') => {
    setFeedback(prev => ({ ...prev, [model]: type }))
    onFeedback?.(model, type)
  }

  const copyResponse = async (model: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(model)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const getRankBadge = (rank?: number) => {
    if (!rank) return null
    const colors: Record<number, string> = {
      1: 'bg-yellow-500 text-white',
      2: 'bg-gray-400 text-white',
      3: 'bg-amber-600 text-white',
    }
    return (
      <Badge className={`${colors[rank] ?? ''} flex items-center gap-1`}>
        <Trophy className="w-3 h-3" />
        #{rank}
      </Badge>
    )
  }

  const getModelDisplayName = (modelId: string) => {
    const names: Record<string, string> = {
      'llama3-8b-8192': 'Llama 3 8B',
      'llama3-70b-8192': 'Llama 3 70B',
      'mixtral-8x7b-32768': 'Mixtral 8x7B',
      'gemma-7b-it': 'Gemma 7B',
      'gemma2-9b-it': 'Gemma 2 9B',
      'llama-3.1-8b-instant': 'Llama 3.1 8B',
      'llama-3.3-70b-versatile': 'Llama 3.3 70B',
      'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout (17B)',
      'mistralai/mistral-7b-instruct': 'Mistral 7B',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-pro': 'Gemini Pro',
    }
    return names[modelId] || modelId
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {responses.map((response) => (
        <Card key={response.model} className={`relative flex flex-col ${response.rank === 1 ? 'ring-2 ring-yellow-400' : ''}`}>
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {getModelDisplayName(response.model)}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getRankBadge(response.rank)}
                {response.status === 'fulfilled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyResponse(response.model, response.text)}
                  >
                    {copied === response.model ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {response.timeMs}ms
            </div>
          </CardHeader>

          <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[500px]">
            {response.status === 'rejected' ? (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{response.error || 'Request failed'}</span>
              </div>
            ) : (
              <div className="text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-6 text-foreground">{children}</p>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2 text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1 text-foreground">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-foreground">{children}</ol>,
                    li: ({ children }) => <li className="leading-5 text-foreground">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    code: ({ className, children, ...props }: any) => {
                      const isBlock = className?.includes('language-')
                      if (!isBlock) {
                        return <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono border border-border" {...props}>{children}</code>
                      }
                      return (
                        <div className="my-2 rounded overflow-hidden border border-border">
                          <div className="bg-zinc-900 px-3 py-1 text-[10px] text-zinc-400 font-mono uppercase">
                            {className?.replace('language-', '') || 'code'}
                          </div>
                          <div className="overflow-x-auto bg-zinc-950">
                            <pre className="p-3 m-0 bg-transparent">
                              <code className={`${className} text-xs text-zinc-100 font-mono whitespace-pre`} {...props}>{children}</code>
                            </pre>
                          </div>
                        </div>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                  }}
                >
                  {response.text}
                </ReactMarkdown>
              </div>
            )}

            {response.status === 'fulfilled' && (
              <div className="flex items-center gap-2 pt-2 border-t flex-shrink-0">
                <span className="text-xs text-muted-foreground mr-2">Rate:</span>
                <Button
                  size="sm"
                  variant={feedback[response.model] === 'like' ? 'default' : 'outline'}
                  onClick={() => handleFeedback(response.model, 'like')}
                  className="h-7 px-2"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={feedback[response.model] === 'dislike' ? 'default' : 'outline'}
                  onClick={() => handleFeedback(response.model, 'dislike')}
                  className="h-7 px-2"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
