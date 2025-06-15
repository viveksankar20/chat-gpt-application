"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, MessageSquare, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types/chat"

interface ChatSidebarProps {
  chats: Chat[]
  activeChat: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
}

export function ChatSidebar({ chats, activeChat, onChatSelect, onNewChat, onDeleteChat }: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <Button
          onClick={onNewChat}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                activeChat === chat.id ? "bg-gray-700" : "hover:bg-gray-800",
              )}
              onClick={() => onChatSelect(chat.id)}
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
                  onDeleteChat(chat.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
