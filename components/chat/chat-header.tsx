"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface ChatHeaderProps {
  title: string
  onOpenSidebar: () => void
}

export function ChatHeader({ title, onOpenSidebar }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={onOpenSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </Sheet>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}
