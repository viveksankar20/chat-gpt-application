"use client"

import { useSession } from "next-auth/react"
import { ChatClient } from "@/components/chat/chat-client"
import { useEffect, useState } from "react"
import type { Chat, Message } from "@/types/chat"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      // Load initial data when user is authenticated
      loadInitialData()
    }
  }, [session])

  const loadInitialData = async () => {
    try {
      // Load chats
      const chatsResponse = await fetch("/api/chats")
      const chatsData = await chatsResponse.json()
      if (chatsData.success && chatsData.chats) {
        setChats(chatsData.chats)
        if (chatsData.chats.length > 0) {
          setActiveChat(chatsData.chats[0].id)
          // Load messages for the first chat
          const messagesResponse = await fetch(`/api/chats/${chatsData.chats[0].id}`)
          const messagesData = await messagesResponse.json()
          if (messagesData.success && messagesData.messages) {
            setMessages(messagesData.messages)
          }
        }
        // If no chats exist, that's fine - user can start typing to create one
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-14">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">Welcome to ChatGPT Clone</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to start chatting with our AI assistant powered by GROQ.
          </p>
          <div className="space-y-3">
            <a
              href="/auth/signin"
              className="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/auth/signup"
              className="block w-full border border-input bg-background text-foreground py-2 px-4 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ChatClient
        initialChats={chats}
        initialMessages={messages}
        initialActiveChat={activeChat}
      />
    </div>
  )
}
