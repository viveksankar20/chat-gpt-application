"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Send, Bot } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void
  loading: boolean
}

const MODEL_OPTIONS = [
  { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 (70B)', speed: 'Fast' },
  { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout (17B)', speed: 'Medium' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 (70B)', speed: 'Fast' },
  { value: 'gemma2-9b-it', label: 'Gemma2 (9B)', speed: 'Very Fast' },
  { value: 'qwen-qwq-32b', label: 'Qwen (32B)', speed: 'Medium' },
]

export function ChatInput({ onSendMessage, loading }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [model, setModel] = useState('deepseek-r1-distill-llama-70b')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || loading) {
      return
    }
    onSendMessage(input.trim(), model)
    setInput("")
  }

  const selectedModel = MODEL_OPTIONS.find(m => m.value === model)

  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Model Dropdown */}
          <Select value={model} onValueChange={setModel} disabled={loading}>
            <SelectTrigger className="w-full sm:w-auto min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((modelOption) => (
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
          
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here to start a new conversation..."
              className="w-full pr-12 py-4 text-base"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        
        <div className="flex items-center justify-between mt-2 px-4">
          <p className="text-xs text-muted-foreground">
            ChatGPT can make mistakes. Consider checking important information.
          </p>
          {selectedModel && (
            <div className="flex items-center space-x-2">
              <Bot className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {selectedModel.speed}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
