import { redirect } from "next/navigation"
import { ChatService } from "@/lib/chat-service"
import { ChatClient } from "@/components/chat/chat-client"

export default async function HomePage() {
  try {
    // Fetch initial data on the server
    const chats = await ChatService.getChats()

    // If no chats exist, create a default one
    if (chats.length === 0) {
      // Redirect to a route that will create a new chat
      redirect("/new-chat")
    }

    const activeChat = chats[0]
    const messages = activeChat ? await ChatService.getMessages(activeChat.id) : []

    return <ChatClient initialChats={chats} initialMessages={messages} initialActiveChat={activeChat?.id || null} />
  } catch (error) {
    console.error("Error loading initial data:", error)

    // Fallback to empty state
    return <ChatClient initialChats={[]} initialMessages={[]} initialActiveChat={null} />
  }
}
