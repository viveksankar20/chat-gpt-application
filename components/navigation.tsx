"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { LogIn, LogOut, Menu, MessageSquare, PanelRightClose, PanelRightOpen, TestTube, User, UserPlus, X } from "lucide-react"
import { useZustand } from "@/hooks/zustand"
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

export function Navigation() {
  const { data: session, status } = useSession()
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false)
  const { isOpen, toggle } = useZustand()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-2">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="hidden h-6 w-6 text-primary sm:block" />
            <button
              type="button"
              className="inline-flex items-center sm:hidden"
              onClick={toggle}
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isOpen ? <PanelRightClose className="h-6 w-6 text-primary" /> : <PanelRightOpen className="h-6 w-6 text-primary" />}
            </button>
            <Link href="/" className="flex items-center">
              <span className="text-lg font-bold sm:text-xl">Nexus AI</span>
            </Link>
          </div>
          <Separator orientation="vertical" className="hidden h-6 sm:flex" />
          <Badge variant="secondary" className="hidden text-xs sm:flex">
            GROQ Powered
          </Badge>
        </div>

        <div className="ml-auto hidden items-center space-x-2 sm:flex">
          <Link href="/groq-tester">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>GROQ Tester</span>
            </Button>
          </Link>

          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
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

        <div className="ml-auto flex items-center sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="ml-2 rounded-md border p-2"
            onClick={() => setIsOpenMobileMenu((prev) => !prev)}
            aria-label={isOpenMobileMenu ? "Close menu" : "Open menu"}
          >
            {isOpenMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpenMobileMenu && (
        <div className="space-y-3 border-t bg-background p-4 sm:hidden">
          <Button variant="outline" className="h-12 w-full justify-start space-x-2" asChild>
            <Link href="/groq-tester">
              <TestTube className="h-5 w-5" />
              <span className="text-base">GROQ Tester</span>
            </Link>
          </Button>

          {session ? (
            <Button onClick={handleSignOut} variant="destructive" className="h-12 w-full justify-start space-x-2">
              <LogOut className="h-5 w-5" />
              <span className="text-base">Sign Out</span>
            </Button>
          ) : (
            <div className="flex flex-col space-y-3 pt-2">
              <Button variant="outline" className="h-12 w-full justify-start space-x-2" asChild>
                <Link href="/auth/signin">
                  <LogIn className="h-5 w-5" />
                  <span className="text-base">Sign In</span>
                </Link>
              </Button>

              <Button className="h-12 w-full justify-start space-x-2" asChild>
                <Link href="/auth/signup">
                  <UserPlus className="h-5 w-5" />
                  <span className="text-base">Sign Up</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
