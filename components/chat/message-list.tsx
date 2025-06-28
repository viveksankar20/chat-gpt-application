"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot } from "lucide-react"
import { MessageItem } from "./message-item"
import type { Message } from "@/types/chat"

interface MessageListProps {
  messages: Message[]
  loading: boolean
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
}

export function MessageList({ messages, loading, onEditMessage, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">Welcome to ChatGPT Clone!</h2>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base mb-4">
              Just start typing below to begin a new conversation. I can help with questions, coding, writing, analysis, and much more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">💡 Ask Questions</p>
                <p className="text-muted-foreground">Get help with any topic</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">💻 Code Help</p>
                <p className="text-muted-foreground">Debug, explain, or write code</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">✍️ Writing</p>
                <p className="text-muted-foreground">Essays, emails, or creative writing</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">🔍 Analysis</p>
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
              <div className="group relative px-4 py-6 bg-muted/50">
                <div className="max-w-3xl mx-auto flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-muted-foreground text-sm">Thinking...</span>
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
