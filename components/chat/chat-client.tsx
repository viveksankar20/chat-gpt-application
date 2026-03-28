"use client"

import React, { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
import { CompareView } from "./CompareView"
import { CompareToggle } from "./CompareToggle"
import { cn } from "@/lib/utils"
import { Menu, Plus, Sparkles } from "lucide-react"
import type { Chat, Message } from "@/types/chat"
import { useZustand } from "@/hooks/zustand"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

interface CompareResponse {
  model: string
  text: string
  timeMs: number
  status: 'fulfilled' | 'rejected'
  error?: string
  rank?: number
  score?: number
}

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
  const [loadingChats, setLoadingChats] = useState(true)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [compareResponses, setCompareResponses] = useState<CompareResponse[]>([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [lastScrollTop, setLastScrollTop] = useState(0)
  
  // Feature 9: Frontend Improvements - Retry mechanics
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [lastFailedModel, setLastFailedModel] = useState<string | null>(null)
  
  const {isOpen,toggle}=useZustand()
  const router = useRouter()
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
        router.push(`/${data.chat.id}`)
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
      if (!data.success) {
        toast.error(data.error || data.message || "Failed to delete chat")
        return
      }

      setChats((prev) => {
        const next = prev.filter((chat) => chat.id !== chatId)
        if (activeChat === chatId) {
          if (next.length > 0) {
            const newId = next[0].id
            Promise.resolve().then(() => {
              setActiveChat(newId)
              router.push(`/${newId}`)
            })
          } else {
            Promise.resolve().then(() => {
              void createNewChat()
            })
          }
        }
        return next
      })
      toast.success("Chat deleted")
    } catch (error) {
      toast.error("Error deleting chat")
      console.error("Error deleting chat:", error)
    }
  }

  const switchChat = (chatId: string): void => {
    setActiveChat(chatId)
    router.push(`/${chatId}`)
  }

  const sendMessage = async (content: string, selectedModel: string): Promise<void> => {
    if (isCompareMode) {
      await sendCompareMessage(content)
    } else {
      await sendNormalMessage(content, selectedModel)
    }
  }

  const sendNormalMessage = async (content: string, selectedModel: string): Promise<void> => {
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
      setLastFailedMessage(null)
      loadChats() // Reload chats to update the title if it changed
    }
    else if(!data.success){
      setLastFailedMessage(content)
      setLastFailedModel(selectedModel)
      toast.error(data.error?.error?.error?.message || data.error || "Failed to get response")
    }
    console.log(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setLastFailedMessage(content)
    setLastFailedModel(selectedModel)
    toast.error(message)
    console.error("Error sending message:", error)
  } finally {
    setLoading(false)
  }
  }

  const retryLastMessage = () => {
    if (lastFailedMessage && lastFailedModel) {
      const msg = lastFailedMessage;
      setLastFailedMessage(null);
      sendMessage(msg, lastFailedModel);
    }
  }

  const sendCompareMessage = async (content: string): Promise<void> => {
    setCompareLoading(true)
    setCompareResponses([])

    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      })

      const data = await response.json()

      if (data.success) {
        setCompareResponses(data.data.responses)
        toast.success(`Compared ${data.data.responses.length} AI models`)
      } else {
        toast.error(data.error || "Failed to get comparison")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message)
      console.error("Error in compare mode:", error)
    } finally {
      setCompareLoading(false)
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

  const handleCompareFeedback = (model: string, feedback: 'like' | 'dislike') => {
    // TODO: Send feedback to backend for analytics
    console.log(`Feedback for ${model}: ${feedback}`)
    toast.success(`Thanks for your feedback on ${model}!`)
  }

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        setChats(prev => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)))
        toast.success("Chat renamed")
      } else {
        toast.error("Failed to rename chat")
      }
    } catch (error) {
      console.error("Error renaming chat:", error)
      toast.error("Error renaming chat")
    }
  }

  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode)
    if (!isCompareMode) {
      // Switching to compare mode, clear any existing responses
      setCompareResponses([])
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (messages.length === 0) {
      if (!isInputVisible) setIsInputVisible(true)
      return
    }
    const currentScrollTop = e.currentTarget.scrollTop
    // If scrolling up, hide input. If scrolling down or at bottom, show it.
    if (currentScrollTop < lastScrollTop - 10) {
      setIsInputVisible(false)
    } else if (currentScrollTop > lastScrollTop + 10 || currentScrollTop <= 0) {
      setIsInputVisible(true)
    }
    setLastScrollTop(currentScrollTop)
  }


  // Load chats + latest chat messages on first load
const initRef = React.useRef(false)
useEffect(() => {
  if (initRef.current) return
  initRef.current = true
  const init = async () => {
    try {
      setLoadingChats(true)
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (data.success && data.chats.length > 0) {
        setChats(data.chats);
        const latestChat = data.chats[0];
        setActiveChat(latestChat.id);
        router.replace(`/${latestChat.id}`);
        const messageRes = await fetch(`/api/chats/${latestChat.id}`);
        const messageData = await messageRes.json();
        if (messageData.success && messageData.messages) {
          setMessages(messageData.messages);
        }
      } else {
        await createNewChat();
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoadingChats(false)
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
          onUpdateTitle={renameChat}
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
            onUpdateTitle={renameChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen  md:ml-64">
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => toggle()}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
               <h2 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md text-primary/80 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {activeChat ? chats.find((c) => c.id === activeChat)?.title || "Untitled Chat" : "New Chat"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="bg-muted/50 p-1 rounded-full border border-muted-foreground/10 flex items-center shadow-inner">
                <button 
                  className={cn(
                    "text-[10px] font-bold px-4 py-1.5 rounded-full transition-all duration-200", 
                    !isCompareMode ? "bg-background shadow-md text-primary scale-105" : "text-muted-foreground hover:bg-muted"
                  )} 
                  onClick={() => isCompareMode && toggleCompareMode()}
                >
                  CHAT
                </button>
                <button 
                  className={cn(
                    "text-[10px] font-bold px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5", 
                    isCompareMode ? "bg-background shadow-md text-primary scale-105" : "text-muted-foreground hover:bg-muted"
                  )} 
                  onClick={() => !isCompareMode && toggleCompareMode()}
                >
                  COMPARE <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                </button>
             </div>
             
             <div className="h-4 w-px bg-muted-foreground/20 hidden sm:block" />
             
             <Button 
                variant="default" 
                size="sm" 
                onClick={createNewChat} 
                className="hidden sm:flex h-8 px-4 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-bold text-[10px] bg-primary text-primary-foreground border-none"
             >
               <Plus className="h-3.5 w-3.5 mr-1" />
               NEW
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden pt-16 mt-0">
          {isCompareMode ? (
            <div className="h-full p-4 overflow-y-auto" onScroll={handleScroll}>
              {compareResponses.length > 0 ? (
                <CompareView
                  responses={compareResponses}
                  onFeedback={handleCompareFeedback}
                  isLoading={compareLoading}
                />
              ) : compareLoading ? (
                <CompareView
                  responses={[]}
                  onFeedback={handleCompareFeedback}
                  isLoading={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg mb-2">Ready to compare AI models</p>
                    <p className="text-sm">Send a message to get responses from multiple AI models simultaneously</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 sm:mb-16 mb-24 relative h-full">
              <MessageList
                messages={messages}
                loading={loading}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                onScroll={handleScroll}
              />
            </div>
          )}
        </div>

        <div className={cn(
          "fixed bottom-0 left-0 right-0 md:left-64 flex flex-col items-center transition-transform duration-300 ease-in-out z-30",
          isInputVisible ? "translate-y-0" : "translate-y-full"
        )}>
          {!isCompareMode ? (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-4 pb-4">
              {lastFailedMessage && (
                <button 
                  onClick={retryLastMessage}
                  className="mb-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm shadow-lg hover:bg-destructive/90 transition-all flex items-center gap-2 font-medium"
                >
                  <span>⚠️ Request Failed</span>
                  <span className="underline">Click to Retry</span>
                </button>
              )}
              <ChatInput onSendMessage={sendMessage} loading={loading} />
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto px-4 pb-4">
              <ChatInput onSendMessage={sendMessage} loading={compareLoading} isCompareMode={true} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


