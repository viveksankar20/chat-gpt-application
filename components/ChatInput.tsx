"use client"

import { Send } from "lucide-react"
import { useRef, useEffect } from "react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled: boolean
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="w-full border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (Shift+Enter for new line)"
          disabled={disabled}
          className="flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900 min-h-[50px] max-h-[200px]"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="mb-1 rounded-xl bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-600 h-[50px] w-[50px] flex items-center justify-center"
        >
          <span className="sr-only">Send</span>
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
