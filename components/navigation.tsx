"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TestTube,
  MessageSquare,
  Settings,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"
import { useZustand } from "@/hooks/zustand"
import { PanelRightClose ,PanelRightOpen} from 'lucide-react';
export function Navigation() {
  const { data: session, status } = useSession()
  const [isOpens, setIsOpen] = useState(false)
const {isOpen,toggle}=useZustand()
  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }
console.log(isOpen)
  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 flex h-14 items-center">
        
        {/* Left Section */}
        <div className="flex items-center sm:space-x-4 space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <MessageSquare className="h-6 sm:block hidden w-6 text-primary" />
            {isOpen?<PanelRightClose className="h-6 sm:hidden block  w-6 text-primary" onClick={()=>{toggle()}}/>:<PanelRightOpen className="h-6 sm:hidden block w-6 text-primary" onClick={()=>{toggle()}}/>}
            <span className="sm:text-xl text-lg font-bold">ChatGPT Clone</span>
          </Link>
          <Separator orientation="vertical" className="h-6 hidden sm:flex" />
          <Badge variant="secondary" className="text-xs hidden sm:flex">
            GROQ Powered
          </Badge>
        </div>

        {/* Desktop Menu */}
        <div className="ml-auto sm:flex hidden items-center space-x-2">
          <Link href="/groq-tester">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>GROQ Tester</span>
            </Button>
          </Link>

          {status === "loading" ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{session.user?.name || session.user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
               
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="ml-auto sm:hidden flex items-center">
          <ThemeToggle />
          <button
            className="ml-2 p-2 rounded-md border"
            onClick={() => setIsOpen(!isOpens)}
          >
            {isOpens ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpens && (
        <div className="sm:hidden border-t bg-background p-4 space-y-3">
          <Link href="/groq-tester">
            <Button variant="outline" className="w-full flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>GROQ Tester</span>
            </Button>
          </Link>

          {session ? (
            <>
           

              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>

              <Link href="/auth/signup">
                <Button className="w-full flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}


