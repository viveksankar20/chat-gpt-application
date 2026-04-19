"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Plus, Sparkles } from "lucide-react"
import { toast } from "react-toastify"
import { useZustand } from "@/hooks/zustand"
import { cn } from "@/lib/utils"
import type { Chat, Message } from "@/types/chat"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"

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
  const [compareLoading, setCompareLoading] = useState(false)
  const [isEcommerceMode, setIsEcommerceMode] = useState(false)
  const [ecommerceLoading, setEcommerceLoading] = useState(false)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [lastFailedModel, setLastFailedModel] = useState<string | null>(null)

  const { isOpen, toggle, settings, setSettings } = useZustand()
  const router = useRouter()
  const initRef = useRef(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings")
        const data = await res.json()
        if (data.success) {
          setSettings(data.user)
        }
      } catch (err) {
        console.error("Failed to fetch settings", err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeChat) {
      void loadMessages(activeChat)
    }
  }, [activeChat])

  const syncModeFromMessages = (nextMessages: Message[]) => {
    const lastMsg = nextMessages[nextMessages.length - 1]
    if (!lastMsg) {
      setIsCompareMode(false)
      setIsEcommerceMode(false)
      return
    }

    if (lastMsg.type === "ecommerce") {
      setIsEcommerceMode(true)
      setIsCompareMode(false)
      return
    }

    if (lastMsg.type === "compare") {
      setIsCompareMode(true)
      setIsEcommerceMode(false)
      return
    }

    setIsCompareMode(false)
    setIsEcommerceMode(false)
  }

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
        syncModeFromMessages(data.messages)
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
        if (isOpen) toggle()
        router.push(`/${data.chat.id}`)
      }
    } catch (error) {
      toast.error("Error creating chat")
      console.error("Error creating chat:", error)
    }
  }

  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: "DELETE" })
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
    if (isOpen) toggle()
    router.push(`/${chatId}`)
  }

  const getOrCreateChatId = async (content: string) => {
    if (activeChat) return activeChat

    const title = content.length > 50 ? `${content.substring(0, 50).trim()}...` : content.trim()
    const newChatResponse = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })

    const newChatData = await newChatResponse.json()
    if (newChatData.success && newChatData.chat) {
      setChats((prev) => [newChatData.chat, ...prev])
      setActiveChat(newChatData.chat.id)
      setMessages([])
      router.push(`/${newChatData.chat.id}`)
      return newChatData.chat.id
    }

    throw new Error("Failed to create new chat")
  }

  const sendNormalMessage = async (content: string, selectedModel: string): Promise<void> => {
    setLoading(true)
    try {
      const chatId = await getOrCreateChatId(content)
      const response = await fetch(`/api/chats/${chatId}/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: selectedModel }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.error?.error?.message || errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const userMessageId = response.headers.get("X-User-Message-Id") || Date.now().toString()
      const userMessageCreatedAt = response.headers.get("X-User-Message-CreatedAt") || new Date().toISOString()
      const isCached = response.headers.get("X-Is-Cached") === "true"
      const assistantMessageId = `${Date.now()}-assistant`

      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", content, createdAt: userMessageCreatedAt },
        { id: assistantMessageId, role: "assistant", content: "", createdAt: new Date().toISOString(), isCached },
      ])

      setLastFailedMessage(null)
      void loadChats()

      const decoder = new TextDecoder()
      let streamContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamContent += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: streamContent } : msg)),
        )
      }
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

  const sendCompareMessage = async (content: string): Promise<void> => {
    setCompareLoading(true)
    try {
      const chatId = await getOrCreateChatId(content)
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, chatId }),
      })

      const data = await response.json()
      if (data.success) {
        const nextMessages = [...messages, data.userMessage, data.assistantMessage]
        setMessages(nextMessages)
        syncModeFromMessages(nextMessages)
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

  const sendEcommerceSearch = async (query: string): Promise<void> => {
    setEcommerceLoading(true)
    try {
      const chatId = await getOrCreateChatId(query)
      const response = await fetch("/api/ecommerce/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, chatId }),
      })

      const data = await response.json()
      if (data.success) {
        const nextMessages = [...messages, data.userMessage, data.assistantMessage]
        setMessages(nextMessages)
        syncModeFromMessages(nextMessages)
        toast.success("Found products on Amazon and Flipkart")
      } else {
        toast.error(data.error || "Failed to find products")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message)
      console.error("Error in ecommerce search:", error)
    } finally {
      setEcommerceLoading(false)
    }
  }

  const sendMessage = async (content: string, selectedModel: string): Promise<void> => {
    if (isEcommerceMode) {
      await sendEcommerceSearch(content)
      return
    }

    if (isCompareMode) {
      await sendCompareMessage(content)
      return
    }

    await sendNormalMessage(content, selectedModel)
  }

  const retryLastMessage = () => {
    if (lastFailedMessage && lastFailedModel) {
      const msg = lastFailedMessage
      setLastFailedMessage(null)
      void sendMessage(msg, lastFailedModel)
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
      const response = await fetch(`/api/messages/${messageId}`, { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)))
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
    setIsEcommerceMode(false)
    setIsCompareMode((prev) => !prev)
  }

  const toggleEcommerceMode = () => {
    setIsCompareMode(false)
    setIsEcommerceMode((prev) => !prev)
  }

  const handleScroll = (_e: React.UIEvent<HTMLDivElement>) => {
    // Reserved for future scroll-based UI behavior.
  }

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      try {
        setLoadingChats(true)
        const response = await fetch("/api/chats")
        const data = await response.json()

        if (data.success && data.chats.length > 0) {
          setChats(data.chats)

          let targetId = initialActiveChat
          if (!targetId || !data.chats.some((c: Chat) => c.id === targetId)) {
            targetId = data.chats[0].id
          }

          setActiveChat(targetId)

          if (targetId !== initialActiveChat) {
            router.replace(`/${targetId}`)
          }

          const messageRes = await fetch(`/api/chats/${targetId}`)
          const messageData = await messageRes.json()
          if (messageData.success && messageData.messages) {
            setMessages(messageData.messages)
            syncModeFromMessages(messageData.messages)
          }
        } else {
          await createNewChat()
        }
      } catch (error) {
        console.error("Error initializing chat:", error)
      } finally {
        setLoadingChats(false)
      }
    }

    void init()
  }, [initialActiveChat, router])

  return (
    <div className="flex bg-background">
      <div className="fixed bottom-0 left-0 top-0 z-20 hidden w-64 md:block">
        <ChatSidebar
          chats={chats}
          activeChat={activeChat}
          onChatSelect={switchChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          onUpdateTitle={renameChat}
        />
      </div>

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (open !== isOpen) toggle()
        }}
      >
        <SheetContent side="left" className="w-[85vw] p-0 sm:w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Chat Sidebar</SheetTitle>
            <SheetDescription>Manage your conversations and settings</SheetDescription>
          </SheetHeader>
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

      <main className="flex h-screen flex-1 flex-col md:ml-64">
        <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:left-64">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={toggle} aria-label="Open chat sidebar">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h2 className="flex max-w-[200px] items-center gap-2 truncate text-sm font-bold uppercase tracking-widest text-primary/80 sm:max-w-md">
                <Sparkles className="h-3 w-3" />
                {activeChat ? chats.find((c) => c.id === activeChat)?.title || "Untitled Chat" : "New Chat"}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center overflow-x-auto rounded-full border border-muted-foreground/10 bg-muted/50 p-1 shadow-inner">
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-[10px] font-bold transition-all duration-200 sm:px-4",
                  !isCompareMode && !isEcommerceMode ? "scale-105 bg-background text-primary shadow-md" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => {
                  setIsCompareMode(false)
                  setIsEcommerceMode(false)
                }}
              >
                CHAT
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all duration-200 sm:px-4",
                  isCompareMode ? "scale-105 bg-background text-primary shadow-md" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={toggleCompareMode}
              >
                COMPARE <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all duration-200 sm:px-4",
                  isEcommerceMode ? "scale-105 bg-background text-primary shadow-md" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={toggleEcommerceMode}
              >
                SHOP <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              </button>
            </div>

            <div className="hidden h-4 w-px bg-muted-foreground/20 sm:block" />

            <Button
              variant="default"
              size="sm"
              onClick={createNewChat}
              className="hidden h-8 rounded-full border-none bg-primary px-4 text-[10px] font-bold text-primary-foreground shadow-lg transition-all hover:shadow-primary/20 sm:flex"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              NEW
            </Button>
          </div>
        </header>

        <div className="mt-0 flex-1 overflow-hidden pt-16">
          <div className="relative h-full flex-1 mb-24 sm:mb-16">
            <MessageList
              messages={messages}
              loading={loading || compareLoading || ecommerceLoading}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onScroll={handleScroll}
              autoScroll={settings?.autoScroll}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center px-2 md:left-64 sm:px-0">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 sm:pb-4">
            {lastFailedMessage && (
              <button
                type="button"
                onClick={retryLastMessage}
                className="mb-2 flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg transition-all hover:bg-destructive/90"
              >
                <span>Request failed</span>
                <span className="underline">Tap to retry</span>
              </button>
            )}

            <ChatInput
              onSendMessage={sendMessage}
              loading={isEcommerceMode ? ecommerceLoading : isCompareMode ? compareLoading : loading}
              defaultModel={settings?.defaultModel}
              isCompareMode={isCompareMode}
              isEcommerceMode={isEcommerceMode}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
