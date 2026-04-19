"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { LogOut, MessageSquare, Pencil, PlusCircle, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { SettingsModal } from "../settings/SettingsModal"
import { Settings } from "lucide-react"
import { useZustand } from "@/hooks/zustand"

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
  onUpdateTitle,
}: ChatSidebarProps) {
  const { data: session } = useSession()
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const { settings } = useZustand()

  const displayName = session?.user?.name?.trim() || session?.user?.email || "Account"
  const displayHint = session?.user?.name && session.user?.email ? String(session.user.email) : "Signed in"

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim() && editTitle !== chats.find((c) => c.id === chatId)?.title) {
      onUpdateTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
  }

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="mt-12 flex-shrink-0 border-b p-4">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {chats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Start a new conversation</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  type="button"
                  key={chat.id}
                  className={cn(
                    "group flex w-full flex-col rounded-lg border p-3 text-left transition-colors",
                    activeChat === chat.id ? "border-primary/20 bg-primary/10" : "border-transparent hover:bg-muted/50",
                  )}
                  onClick={() => onChatSelect(chat.id)}
                  aria-current={activeChat === chat.id ? "page" : undefined}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center space-x-3">
                      <MessageSquare
                        className={cn("h-4 w-4 flex-shrink-0", activeChat === chat.id ? "text-primary" : "text-muted-foreground")}
                      />
                      <div className="min-w-0 flex-1">
                        {editingChatId === chat.id ? (
                          <input
                            autoFocus
                            className="h-5 w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0"
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
                          <span className={cn("block truncate text-sm", activeChat === chat.id ? "font-medium" : "")}>{chat.title}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      {editingChatId !== chat.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(chat)
                          }}
                          aria-label="Rename chat"
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
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between pl-7">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-muted-foreground opacity-70">{chat.messageCount} msgs</span>
                      <span className="text-[10px] text-muted-foreground opacity-70">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {activeChat === chat.id && (
                      <Badge variant="secondary" className="h-4 border-none bg-primary/20 px-1 text-[10px] leading-none text-primary">
                        Active
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="mt-auto flex flex-shrink-0 items-center justify-between border-t bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex min-w-0 flex-1 items-center space-x-3 px-2 py-1">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary shadow-sm overflow-hidden">
                {settings?.avatar ? (
                  <img src={settings.avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{settings?.name || displayName}</p>
                <p className="truncate text-[10px] text-muted-foreground opacity-70">{displayHint || "-"}</p>
              </div>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile & Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        user={settings} 
      />

      <Dialog open={!!deleteChatId} onOpenChange={(open) => !open && setDeleteChatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>Are you sure you want to delete this chat? This action cannot be undone.</DialogDescription>
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
