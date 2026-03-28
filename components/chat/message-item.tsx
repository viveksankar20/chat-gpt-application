"use client"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bot, User, Copy, Check, Edit3, Save, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/chat"

interface MessageItemProps {
  message: Message
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
}

export function MessageItem({ message, onEdit, onDelete }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sync edit content if message content changes externally
  React.useEffect(() => {
    setEditContent(message.content)
  }, [message.content])

  const handleSave = () => {
    onEdit(message.id, editContent)
    setIsEditing(false)
  }

  const deleteChat = async (id: string) => {
    setLoading(true)
    await onDelete(id)
    setLoading(false)
  }

  const handleCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const copyCodeToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy code: ", err)
    }
  }

  return (
    <div
      className={cn(
        "group relative px-4 py-6 transition-colors",
        message.role === "assistant" ? "bg-muted/50 hover:bg-muted" : "bg-background hover:bg-muted/30",
      )}
    >
      <div className="max-w-3xl mx-auto flex space-x-4">
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "assistant"
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          {message.isCached && (
            <div className="mt-2 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 whitespace-nowrap">
                ⚡ Instant
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full" />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave} className="h-9">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-9">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              {(() => {
                const renderContent = typeof message.content === 'string' 
                  ? message.content 
                  : JSON.stringify(message.content, null, 2);
                
                return message.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                    // Headings
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0 text-foreground border-b border-border pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-6 mb-3 first:mt-0 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-foreground">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h4>
                    ),
                    // Paragraphs
                    p: ({ children }) => (
                      <p className="text-foreground leading-7 mb-4 last:mb-0">{children}</p>
                    ),
                    // Lists
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-1.5 text-foreground">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-foreground">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-7">{children}</li>
                    ),
                    // Blockquote
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4">
                        {children}
                      </blockquote>
                    ),
                    // Horizontal rule
                    hr: () => <hr className="border-border my-6" />,
                    // Strong / Bold
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    // Emphasis / Italic
                    em: ({ children }) => <em className="italic">{children}</em>,
                    // Links
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:opacity-80 transition-opacity"
                      >
                        {children}
                      </a>
                    ),
                    // Tables
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse border border-border text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                    th: ({ children }) => (
                      <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-4 py-2 text-foreground">{children}</td>
                    ),
                    // Code — inline vs block
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "")
                      // If no class at all it's inline code
                      if (!className) {
                        return (
                          <code
                            className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[13px] font-mono border border-border"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      }

                      const language = match ? match[1] : "code"
                      const codeText = String(children).replace(/\n$/, "")

                      return (
                        <div className="my-4 rounded-lg overflow-hidden border border-border shadow-sm">
                          {/* Header bar */}
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 dark:bg-zinc-950 border-b border-border">
                            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
                              {language}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1.5 px-2 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                              onClick={() => copyCodeToClipboard(codeText)}
                            >
                              {copiedCode === codeText ? (
                                <>
                                  <Check className="h-3 w-3 text-green-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy code</span>
                                </>
                              )}
                            </Button>
                          </div>
                          {/* Code body — whitespace-pre preserves line breaks from AI */}
                          <div className="overflow-x-auto bg-zinc-950">
                            <pre className="p-4 m-0 bg-transparent">
                              <code
                                className={cn(className, "text-sm leading-relaxed text-zinc-100 font-mono whitespace-pre")}
                                {...props}
                              >
                                {children}
                              </code>
                            </pre>
                          </div>
                        </div>
                      )
                    },
                    // Remove default pre wrapper since our code block handles it
                    pre: ({ children }) => <>{children}</>, // passthrough — our code block handles <pre> internally
                  }}
                  >
                    {renderContent}
                  </ReactMarkdown>
                ) : (
                  <p className="leading-relaxed text-foreground whitespace-pre-wrap">{renderContent}</p>
                )
              })()}
            </div>
          )}

          <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(message.content)}
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Message</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={() => deleteChat(message.id)}>
                    {loading ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
