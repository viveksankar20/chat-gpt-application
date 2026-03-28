"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { ClipboardCopy, Check, Copy } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Role = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: Role
  content: string
  createdAt: string
}

interface MessageBubbleProps {
  message: ChatMessage
  onCopy?: () => void
}

export function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCodeToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy code: ", err)
    }
  }

  // Defensive check for content being an object instead of string
  const renderContent = typeof message.content === 'string' 
    ? message.content 
    : JSON.stringify(message.content, null, 2);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={cn(
          "max-w-[90%] p-4 rounded-2xl shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-none"
        )}
      >
        <div className="text-base leading-relaxed break-words overflow-hidden">
          {isUser ? (
            <div className="whitespace-pre-wrap">{renderContent}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 border-b pb-1 border-slate-200 dark:border-slate-700">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold mt-2 mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-normal">{children}</li>,
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "")
                  const isInline = !className
                  
                  if (isInline) {
                    return (
                      <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }

                  const language = match ? match[1] : "code"
                  const codeText = String(children).replace(/\n$/, "")
                  
                  return (
                    <div className="my-4 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 shadow-md">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-mono border-b border-slate-300 dark:border-slate-600">
                        <span className="opacity-70">{language}</span>
                        <button
                          onClick={() => copyCodeToClipboard(codeText)}
                          className="hover:text-blue-500 transition-colors flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                          title="Copy code"
                        >
                          {copiedCode === codeText ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{copiedCode === codeText ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 text-slate-50 overflow-x-auto text-sm font-mono scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    </div>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full border-collapse text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border-b border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-left font-bold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-b border-slate-100 dark:border-slate-800 px-4 py-2 last:border-0">{children}</td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 py-2 pr-4 rounded-r">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-6 border-slate-200 dark:border-slate-700" />,
              }}
            >
              {renderContent || "..."}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && onCopy && (
          <button
            onClick={onCopy}
            aria-label="Copy response"
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white dark:bg-slate-900/75 dark:text-slate-100"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            Copy
          </button>
        )}
      </div>
    </div>
  )
}
