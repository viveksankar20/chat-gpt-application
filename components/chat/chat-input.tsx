"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Send, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void
  loading: boolean
  isCompareMode?: boolean
  isEcommerceMode?: boolean
  defaultModel?: string
}

const MODEL_OPTIONS = [
  { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (17B)", speed: "Medium" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 (70B)", speed: "Fast" },
]

export function ChatInput({
  onSendMessage,
  loading,
  isCompareMode = false,
  isEcommerceMode = false,
  defaultModel,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [model, setModel] = useState("meta-llama/llama-4-scout-17b-16e-instruct")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (defaultModel) {
      const option = MODEL_OPTIONS.find(o => o.label === defaultModel);
      if (option) {
        setModel(option.value);
      }
    }
  }, [defaultModel])

  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = "inherit"
    const scrollHeight = textareaRef.current.scrollHeight
    textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
  }, [input])

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!input.trim() || loading) return

    onSendMessage(input.trim(), model)
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full rounded-2xl border bg-background/90 p-3 shadow-2xl backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:p-4">
      <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          {!isCompareMode && !isEcommerceMode && (
            <Select value={model} onValueChange={setModel} disabled={loading}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((modelOption) => (
                  <SelectItem key={modelOption.value} value={modelOption.value}>
                    <div className="flex w-full items-center justify-between">
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

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isEcommerceMode
                  ? "Search for a product (e.g. Redmi Note 13, Nike Shoes)..."
                  : isCompareMode
                    ? "Ask a question to compare AI models..."
                    : "Type your message here..."
              }
              className="min-h-[52px] max-h-[200px] w-full resize-none bg-background py-3 pr-12 text-sm shadow-sm focus-visible:ring-primary sm:text-base"
              disabled={loading}
              rows={1}
              aria-label={
                isEcommerceMode
                  ? "Search products across stores"
                  : isCompareMode
                    ? "Enter a prompt to compare AI models"
                    : "Type your chat message"
              }
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute bottom-1.5 right-2 h-8 w-8 p-0 transition-transform active:scale-95"
              size="sm"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="mt-2 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground/80">
            {isEcommerceMode ? (
              <span className="flex items-center gap-1 font-medium text-green-600">
                <Tag className="h-3 w-3" />
                Comparing Amazon and Flipkart
              </span>
            ) : isCompareMode ? (
              <>Fast side-by-side model comparison</>
            ) : (
              <>
                <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Shift</kbd> +{" "}
                <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd> for new line
              </>
            )}
          </p>
          <p className={`self-end font-mono text-[11px] sm:self-auto ${input.length > 3000 ? "text-destructive" : "text-muted-foreground/50"}`}>
            {input.length > 0 ? `${input.length} chars` : ""}
          </p>
        </div>
      </div>
    </div>
  )
}
