"use client"

import { useSession } from "next-auth/react"
import { ChatClient } from "@/components/chat/chat-client"

export default function HomePage() {
  const { data: session, status } = useSession()

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
          <h1 className="text-3xl font-bold mb-4">Welcome to Nexus AI</h1>
          <p className="text-muted-foreground mb-6">Please sign in to start chatting instantly.</p>
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
    <div className="h-screen w-full">
      <ChatClient initialChats={[]} initialMessages={[]} initialActiveChat={null} />
    </div>
  )
}
