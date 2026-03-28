"use client"

import { useSession } from "next-auth/react"
import { ChatClient } from "@/components/chat/chat-client"
import { useParams } from "next/navigation"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const chatId = params.chatId as string

  if (status === "loading") {
    return <div className="flex bg-background h-screen w-full items-center justify-center">Loading session...</div>
  }

  if (!session) {
    return <div className="flex bg-background h-screen w-full items-center justify-center">Please sign in to view this chat.</div>
  }

  return (
    <div className="h-screen w-full">
      <ChatClient initialChats={[]} initialMessages={[]} initialActiveChat={chatId} />
    </div>
  )
}
