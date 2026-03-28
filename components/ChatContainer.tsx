"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { ChatInput } from "@/components/ChatInput"
import { MessageBubble, ChatMessage } from "@/components/MessageBubble"
import { TypingIndicator } from "@/components/TypingIndicator"
import { EmptyState } from "@/components/EmptyState"
import { ModelSelector } from "@/components/ModelSelector"
import { modelOptions } from "@/components/modelOptions"

interface StreamEvent {
  event?: string
  data?: string
}

interface MetadataPayload {
  provider: string
  modelId: string
}

function parseSSELine(
  chunk: string,
  onData: (text: string) => void,
  onMeta: (meta: MetadataPayload) => void,
  onDone: () => void,
  onError: (text: string) => void
) {
  const lines = chunk.split("\n")

  let event = ""
  let data = ""

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.replace("event:", "").trim()
      continue
    }

    if (line.startsWith("data:")) {
      const content = line.slice(5) // Remove 'data:'
      // Handle the optional space after 'data:'
      data += content.startsWith(" ") ? content.slice(1) : content
      data += "\n"
    }
  }

  // Remove the trailing newline added in the loop
  const content = data.endsWith("\n") ? data.slice(0, -1) : data

  if (event === "error") {
    onError(content.trim())
  } else if (event === "metadata") {
    try {
      const parsed = JSON.parse(content.trim()) as MetadataPayload
      onMeta(parsed)
    } catch (exception) {
      console.warn("Failed to parse metadata", exception)
    }
  } else if (event === "done" || content.trim() === "[DONE]") {
    onDone()
  } else if (content) {
    // For normal message content, DO NOT TRIM. Preserve newlines and spaces.
    onData(content)
  }
}

export function ChatContainer() {
  const [inputText, setInputText] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserPrompt, setCurrentUserPrompt] = useState<string>("")
  const [modelUsage, setModelUsage] = useState<Record<string, number>>({})
  const [activeModelDescriptor, setActiveModelDescriptor] = useState<string>('Smart AI')

  const bottomRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'smart' | 'advanced'>('smart')
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3.3-70b-versatile')
  const assistantId = useMemo(() => `assistant-${Date.now()}`, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  const addMessage = (m: ChatMessage) => {
    setMessages((prev: ChatMessage[]) => [...prev, m])
  }

  const updateAssistantMessage = (content: string) => {
    setMessages((prev: ChatMessage[]) => {
      if (prev.length === 0) return prev
      const lastAssistantIndex = [...prev].reverse().findIndex((m) => m.role === "assistant")
      if (lastAssistantIndex === -1) return prev
      const index = prev.length - 1 - lastAssistantIndex
      const updated = [...prev]
      updated[index] = { ...updated[index], content }
      return updated
    })
  }

  const handleSend = async () => {
    const prompt = inputText.trim()
    if (!prompt || loading) return

    setError(null)
    setInputText("")
    setCurrentUserPrompt(prompt)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}-${Math.random()}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    }

    addMessage(userMessage)
    addMessage(assistantMessage)

    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelId: mode === 'advanced' ? selectedModelId : undefined }),
      })

      if (!res.ok || !res.body) {
        let errText = "Unable to reach AI service"
        try {
          const body = await res.text()
          errText = body || errText
        } catch {
          // ignore
        }
        throw new Error(errText)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let streamBuffer = ""
      let done = false

      const onData = (data: string) => {
        // Append chunk to the latest assistant message in state.
        setMessages((prev: ChatMessage[]) => {
          const assistantIndex = [...prev].reverse().findIndex((m) => m.role === "assistant")
          if (assistantIndex === -1) return prev
          const index = prev.length - 1 - assistantIndex
          const current = prev[index]
          const updated = [...prev]
          updated[index] = {
            ...current,
            content: `${current.content}${data}`,
          }
          return updated
        })
      }

      const onDone = () => {
        done = true
        setLoading(false)
        toast.success("AI response received")
      }

      const onError = (message: string) => {
        done = true
        setLoading(false)
        setError(message)
        toast.error(`Stream failed: ${message}`)
      }

      // The message parsing approach for basic SSE stream.
      while (!done) {
        const { value, done: readDone } = await reader.read()
        if (readDone) break

        streamBuffer += decoder.decode(value, { stream: true })

        const events = streamBuffer.split("\n\n")
        streamBuffer = events.pop() || ""

        for (const ev of events) {
          parseSSELine(ev, onData, (meta) => {
            setActiveModelDescriptor(`${meta.provider} / ${meta.modelId}`)
            setModelUsage((prev: Record<string, number>) => ({
              ...prev,
              [meta.modelId]: (prev[meta.modelId] ?? 0) + 1,
            }))
          }, onDone, onError)
        }
      }

      if (!done) {
        onDone()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      setLoading(false)
      toast.error(message)

      // mark this assistant message as failed
      setMessages((prev) => {
        const copy = [...prev]
        const idx = copy.findIndex((m) => m.role === "assistant" && m.content === "")
        if (idx >= 0) copy[idx] = { ...copy[idx], content: "😞 Failed to generate response. Please retry." }
        return copy
      })
    }
  }

  const retryLast = () => {
    if (!currentUserPrompt) return
    setInputText(currentUserPrompt)
    setMessages((prev: ChatMessage[]) => prev.filter((m) => m.role !== "assistant" || m.content !== ""))
    setError(null)
    handleSend()
  }

  const copyAssistant = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Response copied")
    } catch {
      toast.error("Copy failed")
    }
  }

  return (
    <section className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-white p-0 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col border-x border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl">
        <div className="border-b border-slate-200 p-4 text-center dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Smart AI Chat</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Ask anything in natural language. No settings needed.</p>
          <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
              <span>Mode:</span>
              <button
                onClick={() => setMode('smart')}
                className={`rounded-full px-3 py-1 ${mode === 'smart' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                Smart AI
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`rounded-full px-3 py-1 ${mode === 'advanced' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                Advanced
              </button>
            </div>
            {mode === 'advanced' && (
              <div className="w-full sm:w-auto">
                <ModelSelector selectedModelId={selectedModelId} onChangeModel={setSelectedModelId} />
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">
            <p>Proxy active model: {activeModelDescriptor}</p>
            <p>
              Usage (per model):{' '}
              {Object.keys(modelUsage).length
                ? Object.keys(modelUsage)
                    .map((id) => `${id}:${modelUsage[id]}`)
                    .join(', ')
                : 'None yet'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-full overflow-auto px-4 py-4 sm:px-6" aria-live="polite">
              <div className="space-y-3">
                {messages.map((message: ChatMessage) => (
                  <div key={message.id}>
                    <MessageBubble
                      message={message}
                      onCopy={message.role === "assistant" ? () => copyAssistant(message.content) : undefined}
                    />
                  </div>
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-600 dark:bg-rose-900/50 dark:text-rose-200">
            <span>{error}</span>
            <button onClick={retryLast} className="rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">
              Retry
            </button>
          </div>
        )}

        <ChatInput value={inputText} onChange={setInputText} onSend={handleSend} disabled={loading} />
      </div>
    </section>
  )
}
