"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { ScrollArea } from "../components/ui/scroll-area"
import { PlusCircle, Send, MessageSquare, Trash2 } from "lucide-react"

type Message = {
  role: "user" | "ai"
  text: string
}

type Chat = {
  id: string
  title: string
  messages: Message[]
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Initialize with a default chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      const newChat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
      }
      setChats([newChat])
      setActiveChat(newChat.id)
    }
  }, [chats])

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
    }
    setChats((prev) => [...prev, newChat])
    setActiveChat(newChat.id)
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (activeChat === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0].id)
      } else {
        createNewChat()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeChat) return

    const userMessage = { role: "user" as const, text: input }

    // Update the current chat with the user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 ? input.slice(0, 20) + (input.length > 20 ? "..." : "") : chat.title,
          }
          : chat,
      ),
    )

    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`/api/chat?query=${encodeURIComponent(input)}`)
      const data = await res.json()

      const aiMessage = {
        role: "ai" as const,
        text: data.message[data.message.length - 1]?.content || "Something went wrong...",
      }

      // Update the current chat with the AI response
      setChats((prev) =>
        prev.map((chat) => (chat.id === activeChat ? { ...chat, messages: [...chat.messages, aiMessage] } : chat)),
      )
    } catch (error) {
      console.error(error)

      // Update with error message
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, { role: "ai", text: "Failed to fetch response." }] }
            : chat,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button variant="ghost" size="icon" onClick={createNewChat} className="hover:bg-gray-800">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${activeChat === chat.id ? "bg-gray-700" : "hover:bg-gray-800"
                  }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-700 h-6 w-6"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold">💬 AI Chat with Code Support</h1>
        </header>

        <main className="flex-1 p-4 overflow-y-auto flex flex-col">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4 p-2">
              {currentChat?.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 ${msg.role === "user" ? "bg-blue-100 ml-12" : "bg-white border border-gray-200 mr-12 shadow-sm"
                    }`}
                >
                  <div className="font-semibold mb-1">{msg.role === "user" ? "You" : "AI Assistant"}</div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded" {...props}>
                            {children}
                          </code>
                        );
                      },

                      h1: (props) => <h1 className="text-2xl font-bold my-4" {...props} />,
                      h2: (props) => <h2 className="text-xl font-bold my-3" {...props} />,
                      h3: (props) => <h3 className="text-lg font-bold my-2" {...props} />,
                      h4: (props) => <h4 className="text-base font-bold my-2" {...props} />,
                      strong: (props) => <strong className="font-bold text-blue-700" {...props} />,
                      em: (props) => <em className="italic text-purple-600" {...props} />,
                      blockquote: (props) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2" {...props} />
                      ),
                    }}

                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ))}
              {loading && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mr-12 shadow-sm">
                  <div className="font-semibold mb-1">AI Assistant</div>
                  <div className="text-gray-500 animate-pulse">Thinking...</div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or request code..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </main>
      </div>
    </div>
  )
}
