"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void
  loading: boolean
}

export function ChatInput({ onSendMessage, loading }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [model, setModel] = useState('deepseek-r1-distill-llama-70b')
  const modelOptions = [
    'deepseek-r1-distill-llama-70b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
    "qwen-qwq-32b",
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || loading) {
      return
    }
    onSendMessage(input.trim(), model)
    setInput("")
  }

  return (
    <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Model Dropdown */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full sm:w-auto"
            disabled={loading}
            style={{ minWidth: 0, maxWidth: 300 }}
          >
            {modelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message ChatGPT..."
              className="w-full pr-12 py-4 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center px-4">
          ChatGPT can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}
