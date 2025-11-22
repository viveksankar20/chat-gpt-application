"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
import type { Chat, Message } from "@/types/chat"
import { useZustand } from "@/hooks/zustand"
import { toast } from "react-toastify"

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
  const {isOpen,toggle}=useZustand()
  // Model selection state
  // const models = [
  //   'deepseek-r1-distill-llama-70b',
  //   'meta-llama/llama-4-scout-17b-16e-instruct',
  //   'gpt-3.5-turbo',
  //   'gpt-4o',
  // ]
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
        // toggle()
      }
    } catch (error) {
      toast.error("Error creating chat")
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
      toast.success("chat deleted successfully")
    } catch (error) {
      toast.error("Error deleting chat")
      console.error("Error deleting chat:", error)
    }
  }

  const switchChat = (chatId: string): void => {
    setActiveChat(chatId)
    // toggle()
  }

  const sendMessage = async (content: string, selectedModel: string): Promise<void> => {
    // if (loading) return
    setLoading(true)
    try {
      let chatId = activeChat

      // If no active chat exists, create a new one
      if (!chatId) {
        // Create a meaningful title from the user's message
        const title = content.length > 50 
          ? content.substring(0, 50).trim() + "..." 
          : content.trim()
        
        const newChatResponse = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        })
        const newChatData = await newChatResponse.json()
        if (newChatData.success && newChatData.chat) {
          chatId = newChatData.chat.id
          setChats((prev) => [newChatData.chat, ...prev])
          setActiveChat(chatId)
          setMessages([])
        } else {
          throw new Error("Failed to create new chat")
        }
      }

      // Send the message to the chat
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: selectedModel }),
      })
      const data = await response.json()
    if (data.success && data.userMessage && data.assistantMessage) {
      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage])
      loadChats() // Reload chats to update the title if it changed
    }
    else if(!data.success){
    toast.error(data.error.error.error.message)

    }
    console.log(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    toast.error(message)
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


  // Load chats + latest chat messages on first load
useEffect(() => {
  const init = async () => {
    try {
      // 1. Load all chats
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (data.success && data.chats.length > 0) {
        setChats(data.chats);

        // 2. Select the latest chat automatically
        const latestChat = data.chats[0];
        setActiveChat(latestChat.id);

        // 3. Load its messages
        const messageRes = await fetch(`/api/chats/${latestChat.id}`);
        const messageData = await messageRes.json();

        if (messageData.success && messageData.messages) {
          setMessages(messageData.messages);
        }
      } else {
        // No chats? Create a new one automatically
        await createNewChat();
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  init();
}, []);

  return (
    <div className="flex  bg-background  ">
   
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-64 z-20">
        <ChatSidebar
          chats={chats}
          activeChat={activeChat}
          onChatSelect={switchChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen}  onOpenChange={()=>{toggle()}}>
        {/* <button onClick={()=>{setSidebarOpen(true)}}>cliidkjfd</button> */}
        <SheetContent side="left" className="p-0 w-[85vw] sm:w-64">
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
      <main className="flex-1 flex flex-col h-screen  md:ml-64">
        <div className="">
          {/* <ChatHeader title={currentChat?.title || "New Chat"} onOpenSidebar={() => setSidebarOpen(true)} /> */}
        </div>

        <div className="flex-1 sm:mb-16 mb-24 relative">
          <MessageList
            messages={messages}
            loading={loading}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
          />
        </div>

        <div className="fixed bottom-0 sm:w-3/4 w-full  ">
          <ChatInput onSendMessage={sendMessage} loading={loading} />
        </div>
      </main>
    </div>
  )
}


