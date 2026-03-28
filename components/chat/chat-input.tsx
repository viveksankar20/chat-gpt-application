"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, Command } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useRef, useEffect } from "react"

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void
  loading: boolean
  isCompareMode?: boolean
}

const MODEL_OPTIONS = [
  // { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 (70B)', speed: 'Fast' },
  { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout (17B)', speed: 'Medium' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 (70B)', speed: 'Fast' },
  // { value: 'gemma2-9b-it', label: 'Gemma2 (9B)', speed: 'Very Fast' },
  // { value: 'qwen-qwq-32b', label: 'Qwen (32B)', speed: 'Medium' },
]

export function ChatInput({ onSendMessage, loading, isCompareMode = false }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [model, setModel] = useState('meta-llama/llama-4-scout-17b-16e-instruct')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!input.trim() || loading) {
      return
    }
    onSendMessage(input.trim(), model)
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }


  return (
    <div className="w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 p-4 border rounded-2xl shadow-2xl mb-2">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Model Dropdown - only show in normal mode */}
          {!isCompareMode && (
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
          )}
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isCompareMode 
                  ? "Ask a question to compare AI models..." 
                  : "Type your message here..."
              }
              className="w-full pr-12 py-3 text-base resize-none min-h-[52px] max-h-[200px] bg-background border-muted-foreground/20 focus-visible:ring-primary shadow-sm"
              disabled={loading}
              rows={1}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-1.5 h-8 w-8 p-0 transition-transform active:scale-95"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground/60">
            {isCompareMode ? (
              <>⚡ Comparing all models simultaneously</>
            ) : (
              <><kbd className="px-1 py-0.5 rounded border border-border text-[10px] font-mono">Shift</kbd> + <kbd className="px-1 py-0.5 rounded border border-border text-[10px] font-mono">Enter</kbd> for new line</>
            )}
          </p>
          <p className={`text-[11px] font-mono ${ input.length > 3000 ? 'text-destructive' : 'text-muted-foreground/40'}`}>
            {input.length > 0 ? `${input.length} chars` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
