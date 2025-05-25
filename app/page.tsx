"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Send, MessageSquare, Trash2, Menu, Bot, User, Copy, Check, Edit3, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message, Chat } from "@/types/chat"

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Load chats on component mount
  useEffect(() => {
    loadChats()
  }, [])

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
        if (data.chats.length > 0 && !activeChat) {
          setActiveChat(data.chats[0].id)
        }
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
        setChats((prev:any) => [data.chat, ...prev])
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
        setChats((prev:any) => prev.filter((chat:any) => chat.id !== chatId))
        if (activeChat === chatId) {
          const remainingChats = chats.filter((chat:any) => chat.id !== chatId)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!input.trim() || !activeChat || loading) return

    const userInput = input.trim()
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(`/api/chats/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userInput }),
      })
      const data = await response.json()

      if (data.success && data.userMessage && data.assistantMessage) {
        setMessages((prev:any) => [...prev, data.userMessage, data.assistantMessage])
        // Reload chats to update the title if it changed
        loadChats()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, messageId: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const startEditMessage = (messageId: string, content: string): void => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  const saveEditMessage = async (messageId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      const data = await response.json()

      if (data.success) {
        setMessages((prev:any) => prev.map((msg:any) => (msg.id === messageId ? { ...msg, content: editContent } : msg)))
        setEditingMessageId(null)
        setEditContent("")
      }
    } catch (error) {
      console.error("Error editing message:", error)
    }
  }

  const cancelEditMessage = (): void => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const deleteMessage = async (messageId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setMessages((prev:any) => prev.filter((msg:any) => msg.id !== messageId))
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  // Sidebar component
  const SidebarContent = (): JSX.Element => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <Button
          onClick={createNewChat}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                activeChat === chat.id ? "bg-gray-700" : "hover:bg-gray-800",
              )}
              onClick={() => switchChat(chat.id)}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="truncate text-sm block">{chat.title}</span>
                  <span className="text-xs text-gray-400">{chat.messageCount} messages</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 hover:bg-gray-600 h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteChat(chat.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-lg font-semibold text-gray-900">{currentChat?.title || "New Chat"}</h1>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
                  <p className="text-gray-600 max-w-md">
                    Start a conversation by typing a message below. I can help with questions, coding, writing, and
                    more.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "group relative px-4 py-6 transition-colors",
                        message.role === "assistant" ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50",
                      )}
                    >
                      <div className="max-w-3xl mx-auto flex space-x-4">
                        <div className="flex-shrink-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              message.role === "assistant"
                                ? "bg-green-100 text-green-600"
                                : "bg-blue-100 text-blue-600",
                            )}
                          >
                            {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingMessageId === message.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full"
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => saveEditMessage(message.id)}>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditMessage}>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              {message.role === "assistant" ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{
                                    code: (props) => {
                                      const { className, children, node } = props as any;
                                      // Check if the code is inline by inspecting the node type
                                      const isInline = node?.inline ?? false;
                                      if (isInline) {
                                        return (
                                          <code
                                            className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                                            {...props}
                                          >
                                            {children}
                                          </code>
                                        )
                                      }
                                      return (
                                        <div className="relative">
                                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                            <code className={className} {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                        </div>
                                      )
                                    },
                                    p: ({ children }) => (
                                      <p className="mb-3 last:mb-0 leading-relaxed text-gray-900">{children}</p>
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                <p className="text-gray-900 leading-relaxed">{message.content}</p>
                              )}
                            </div>
                          )}

                          {editingMessageId !== message.id && (
                            <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(message.content, message.id)}
                                className="h-8 px-2 text-gray-500 hover:text-gray-700"
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditMessage(message.id, message.content)}
                                className="h-8 px-2 text-gray-500 hover:text-gray-700"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-gray-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Message</DialogTitle>
                                  </DialogHeader>
                                  <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                                  <div className="flex justify-end space-x-2 mt-4">
                                    <Button variant="outline">Cancel</Button>
                                    <Button variant="destructive" onClick={() => deleteMessage(message.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="group relative px-4 py-6 bg-gray-50">
                      <div className="max-w-3xl mx-auto flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Bot className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-gray-500 text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message ChatGPT..."
                  className="w-full pr-12 py-3 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ChatGPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
