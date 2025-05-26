"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChatSidebar } from "./chat-sidebar"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
import type { Chat, Message } from "@/types/chat"

interface ChatClientProps {
  initialChats: Chat[]
  initialMessages: Message[]
  initialActiveChat: string | null
}

export function ChatClient({ initialChats, initialMessages, initialActiveChat }: ChatClientProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [activeChat, setActiveChat] = useState<string | null>(initialActiveChat)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat)
    }
  }, [activeChat])

  const loadChats = async (): Promise<void> => {
    try {
      const response = await fetch("/api/chats")
      const data = await response.json()
      if (data.success && data.chats) {
        setChats(data.chats)
      }
    } catch (error) {
      console.error("Error loading chats:", error)
    }
  }

  const loadMessages = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      const data = await response.json()
      if (data.success && data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const createNewChat = async (): Promise<void> => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })
      const data = await response.json()
      if (data.success && data.chat) {
        setChats((prev) => [data.chat, ...prev])
        setActiveChat(data.chat.id)
        setMessages([])
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        setChats((prev) => prev.filter((chat) => chat.id !== chatId))
        if (activeChat === chatId) {
          const remainingChats = chats.filter((chat) => chat.id !== chatId)
          if (remainingChats.length > 0) {
            setActiveChat(remainingChats[0].id)
          } else {
            await createNewChat()
          }
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const switchChat = (chatId: string): void => {
    setActiveChat(chatId)
    setSidebarOpen(false)
  }

  const sendMessage = async (content: string): Promise<void> => {
    if (!activeChat || loading) return

    setLoading(true)

    try {
      const response = await fetch(`/api/chats/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()

      if (data.success && data.userMessage && data.assistantMessage) {
        setMessages((prev) => [...prev, data.userMessage, data.assistantMessage])
        loadChats() // Reload chats to update the title if it changed
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const editMessage = async (messageId: string, content: string): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()

      if (data.success) {
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)))
      }
    } catch (error) {
      console.error("Error editing message:", error)
    }
  }

  const deleteMessage = async (messageId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-gray-200">
        <ChatSidebar
          chats={chats}
          activeChat={activeChat}
          onChatSelect={switchChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <ChatSidebar
            chats={chats}
            activeChat={activeChat}
            onChatSelect={switchChat}
            onNewChat={createNewChat}
            onDeleteChat={deleteChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatHeader title={currentChat?.title || "New Chat"} onOpenSidebar={() => setSidebarOpen(true)} />

        <MessageList
          messages={messages}
          loading={loading}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />

        <ChatInput onSendMessage={sendMessage} loading={loading} />
      </div>
    </div>
  )
}
