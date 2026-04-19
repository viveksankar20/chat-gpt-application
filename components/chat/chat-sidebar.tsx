"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusCircle, MessageSquare, Trash2, Sparkles, Pencil, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types/chat"

interface ChatSidebarProps {
  chats: Chat[]
  activeChat: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  onUpdateTitle: (chatId: string, newTitle: string) => void
}

export function ChatSidebar({ 
  chats, 
  activeChat, 
  onChatSelect, 
  onNewChat, 
  onDeleteChat,
  onUpdateTitle
}: ChatSidebarProps) {
  const { data: session } = useSession()
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null)

  const displayName = session?.user?.name?.trim() || session?.user?.email || "Account"
  const displayHint =
    session?.user?.name && session.user?.email
      ? String(session.user.email)
      : "Signed in"

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim() && editTitle !== chats.find(c => c.id === chatId)?.title) {
      onUpdateTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      <div className="flex-shrink-0 mt-12 p-4 border-b">
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
                    "group flex flex-col p-3 rounded-lg cursor-pointer transition-colors border",
                    activeChat === chat.id 
                      ? "bg-primary/10 border-primary/20" 
                      : "hover:bg-muted/50 border-transparent"
                  )}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <MessageSquare className={cn(
                        "h-4 w-4 flex-shrink-0",
                        activeChat === chat.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="min-w-0 flex-1">
                        {editingChatId === chat.id ? (
                          <input
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 h-5 font-medium"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSaveEdit(chat.id)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(chat.id)
                              if (e.key === "Escape") setEditingChatId(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={cn(
                            "truncate text-sm block",
                            activeChat === chat.id ? "font-medium" : ""
                          )}>
                            {chat.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingChatId !== chat.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(chat)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteChatId(chat.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pl-7">
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] text-muted-foreground opacity-70">
                        {chat.messageCount} msgs
                      </span>
                      <span className="text-[10px] text-muted-foreground opacity-70">
                        • {new Date(chat.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {activeChat === chat.id && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none bg-primary/20 text-primary border-none">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0 p-4 border-t mt-auto bg-muted/20 flex items-center justify-between">
        <div className="flex items-center space-x-3 px-2 py-1 flex-1 min-w-0">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate opacity-70">
              {displayHint || "—"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={!!deleteChatId} onOpenChange={(open) => !open && setDeleteChatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteChatId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteChatId) {
                  onDeleteChat(deleteChatId)
                  setDeleteChatId(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
