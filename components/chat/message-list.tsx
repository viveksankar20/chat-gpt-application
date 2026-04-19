"use client"

import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"
import { MessageItem } from "./message-item"
import type { Message } from "@/types/chat"

interface MessageListProps {
  messages: Message[]
  loading: boolean
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  autoScroll?: boolean
}

export function MessageList({ messages, loading, onEditMessage, onDeleteMessage, onScroll, autoScroll }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll === false) return;
    
    const container = containerRef.current
    if (!container) return

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (distanceFromBottom < 160) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loading, autoScroll])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-y-auto" onScroll={onScroll}>
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-40 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center p-4 text-center sm:p-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold sm:text-2xl">Welcome to Nexus AI!</h2>
            <p className="mb-4 max-w-md text-sm text-muted-foreground sm:text-base">
              Just start typing below to begin a new conversation. I can help with questions, coding, writing, analysis, and much more.
            </p>
            <div className="grid w-full max-w-lg grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 font-medium">Ask Questions</p>
                <p className="text-muted-foreground">Get help with any topic</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 font-medium">Code Help</p>
                <p className="text-muted-foreground">Debug, explain, or write code</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 font-medium">Writing</p>
                <p className="text-muted-foreground">Essays, emails, or creative writing</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 font-medium">Analysis</p>
                <p className="text-muted-foreground">Data analysis and insights</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} onEdit={onEditMessage} onDelete={onDeleteMessage} />
            ))}

            {loading && (
              <div className="group relative bg-muted/50 px-4 py-6">
                <div className="mx-auto flex max-w-3xl space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
