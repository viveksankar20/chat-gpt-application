"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { PlusCircle, MessageSquare, Trash2, Sparkles } from "lucide-react"
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
    <div className="flex flex-col h-full bg-muted/30 border-r">
      <div className="flex-shrink-0  mt-12 p-4 border-b">
        <Button
          onClick={onNewChat}
          className="w-full"
          size="sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Start a new conversation</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    activeChat === chat.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <MessageSquare className={cn(
                      "h-4 w-4 flex-shrink-0",
                      activeChat === chat.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "truncate text-sm block",
                          activeChat === chat.id ? "font-medium" : ""
                        )}>
                          {chat.title}
                        </span>
                        {activeChat === chat.id && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {chat.messageCount} messages
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className=""
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
