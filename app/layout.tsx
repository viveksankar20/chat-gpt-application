import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ToastContainer } from "react-toastify"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/session-provider"

export const metadata: Metadata = {
  title: "Nexus AI",
  description: "A high-performance AI chat interface powered by GROQ",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ToastContainer />
            <Navigation />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
