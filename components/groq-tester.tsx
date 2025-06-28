"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Send, Copy, Check, Code, FileText, Settings, Zap } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"

interface GroqResponse {
  success: boolean
  response?: string
  model?: string
  temperature?: number
  maxTokens?: number
  inputMessage?: string
  systemPrompt?: string
  error?: string
  chunkCount?: number
  responseLength?: number
  details?: string
}

const AVAILABLE_MODELS = [
  { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill (70B)', speed: 'Fast' },
  { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout (17B)', speed: 'Medium' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 (70B Versatile)', speed: 'Fast' },
  { value: 'gemma2-9b-it', label: 'Gemma2 (9B)', speed: 'Very Fast' },
  { value: 'qwen-qwq-32b', label: 'Qwen (32B)', speed: 'Medium' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', speed: 'Fast' },
  { value: 'gpt-4o', label: 'GPT-4o', speed: 'Medium' },
]

const CODE_SYSTEM_PROMPTS = {
  "Complete Code": "You are a helpful AI assistant specialized in providing complete, working code. When asked for code, always provide the FULL, COMPLETE code without any truncation. Include all necessary imports, closing tags, brackets, and complete functions. Never leave code incomplete or cut off mid-sentence.",
  "Standard": "You are a helpful AI assistant. When providing code, always provide the complete code without truncation. If the code is long, make sure to include all necessary parts including closing tags, brackets, and complete functions.",
  "Creative": "You are a creative AI assistant. Provide detailed and imaginative responses while ensuring code is complete and functional.",
  "Concise": "You are a concise AI assistant. Provide brief but complete responses with all necessary code elements included."
}

export function GroqTester() {
  const [message, setMessage] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(CODE_SYSTEM_PROMPTS["Complete Code"])
  const [model, setModel] = useState("deepseek-r1-distill-llama-70b")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<GroqResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [promptMode, setPromptMode] = useState("Complete Code")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch("/api/test-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          model,
          temperature,
          maxTokens,
          systemPrompt
        })
      })

      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: "Failed to connect to GROQ API"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handlePromptModeChange = (mode: string) => {
    setPromptMode(mode)
    setSystemPrompt(CODE_SYSTEM_PROMPTS[mode as keyof typeof CODE_SYSTEM_PROMPTS])
  }

  const isCodeResponse = (response: string) => {
    return response.includes('<!DOCTYPE html>') || 
           response.includes('function') || 
           response.includes('const ') || 
           response.includes('import ') ||
           response.includes('class ') ||
           response.includes('def ') ||
           response.includes('<?php')
  }

  const selectedModel = AVAILABLE_MODELS.find(m => m.value === model)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">GROQ API Tester</h1>
        </div>
        <p className="text-muted-foreground text-lg">Test and preview responses from different GROQ models with enhanced code generation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuration</span>
              </CardTitle>
              <CardDescription>Configure your GROQ API test parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((modelOption) => (
                      <SelectItem key={modelOption.value} value={modelOption.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{modelOption.label}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {modelOption.speed}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-xs text-muted-foreground">
                    Speed: {selectedModel.speed} • {model}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="promptMode">Prompt Mode</Label>
                <Select value={promptMode} onValueChange={handlePromptModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CODE_SYSTEM_PROMPTS).map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">Temperature: {temperature}</Label>
                    <Badge variant="outline">{temperature < 0.5 ? 'Focused' : temperature < 1 ? 'Balanced' : 'Creative'}</Badge>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxTokens">Max Tokens: {maxTokens.toLocaleString()}</Label>
                    <Badge variant="outline">{maxTokens >= 4096 ? 'Extended' : 'Standard'}</Badge>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="8192"
                    step="500"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter system prompt..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Message</CardTitle>
              <CardDescription>Enter your message to test the GROQ API</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">User Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message to test the GROQ API... (e.g., 'give me a login page code')"
                    rows={4}
                    disabled={loading}
                    className="resize-none"
                  />
                </div>
                <Button type="submit" disabled={loading || !message.trim()} className="w-full" size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Response...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to GROQ
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {response.success && response.response && isCodeResponse(response.response) ? (
                      <Code className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-600" />
                    )}
                    <span>Response</span>
                    {response.success && (
                      <Badge variant="secondary">
                        {response.responseLength?.toLocaleString()} chars
                      </Badge>
                    )}
                  </div>
                  {response.success && response.response && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(response.response!)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {response.success ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="font-medium">Model</p>
                        <p className="text-muted-foreground">{response.model}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Temperature</p>
                        <p className="text-muted-foreground">{response.temperature}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Max Tokens</p>
                        <p className="text-muted-foreground">{response.maxTokens?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Chunks</p>
                        <p className="text-muted-foreground">{response.chunkCount || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Input Message</Label>
                        <div className="p-3 bg-muted rounded-lg text-sm border">
                          {response.inputMessage}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">AI Response</Label>
                        <div className="border rounded-lg overflow-hidden">
                          {isCodeResponse(response.response || '') ? (
                            <pre className="bg-muted p-4 overflow-x-auto text-sm">
                              <code className="text-foreground">{response.response}</code>
                            </pre>
                          ) : (
                            <div className="p-4 bg-muted prose prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  code: ({ node, className, children, ...props }) => {
                                    // @ts-ignore
                                    const isInline = node?.inline === true || node?.type === "inlineCode";
                                    if (isInline) {
                                      return (
                                        <code
                                          className="bg-background text-foreground px-1.5 py-0.5 rounded text-sm font-mono border"
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      )
                                    }
                                    return (
                                      <pre className="bg-background text-foreground p-4 rounded-lg overflow-x-auto border">
                                        <code className={cn(className, "text-foreground")} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    )
                                  },
                                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>,
                                }}
                              >
                                {response.response}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive font-medium">Error:</p>
                    <p className="text-destructive/80">{response.error}</p>
                    {response.details && (
                      <p className="text-destructive/60 text-sm mt-2">{response.details}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 