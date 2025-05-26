import { notFound } from "next/navigation"
import { ChatService } from "@/lib/chat-service"
import { ChatClient } from "@/components/chat/chat-client"

interface ChatPageProps {
  params: {
    chatId: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  try {
    const [chats, chatData] = await Promise.all([ChatService.getChats(), ChatService.getChat(params.chatId)])

    if (!chatData) {
      notFound()
    }

    return <ChatClient initialChats={chats} initialMessages={chatData.messages} initialActiveChat={params.chatId} />
  } catch (error) {
    console.error("Error loading chat:", error)
    notFound()
  }
}

export async function generateStaticParams() {
  try {
    const chats = await ChatService.getChats()
    return chats.map((chat) => ({
      chatId: chat.id,
    }))
  } catch (error) {
    return []
  }
}
