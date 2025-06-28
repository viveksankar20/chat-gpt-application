"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, MessageSquare } from "lucide-react"

interface ChatHeaderProps {
  title: string
  onOpenSidebar: () => void
}

export function ChatHeader({ title, onOpenSidebar }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-10 w-10 p-0"
              onClick={onOpenSidebar}
              type="button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </Sheet>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          <Badge variant="secondary" className="text-xs">
            GROQ
          </Badge>
        </div>
      </div>
    </header>
  )
}
