"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Bot, Check, Copy, Edit3, Save, Trash2, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EcommerceView } from "../ecommerce/EcommerceView"
import { CompareView } from "./CompareView"

const extractText = (node: any): string => {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node && node.props && node.props.children) {
    return extractText(node.props.children)
  }
  return ""
}

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

  React.useEffect(() => {
    setEditContent(message.content)
  }, [message.content])

  const handleSave = () => {
    onEdit(message.id, editContent)
    setIsEditing(false)
  }

  const handleDelete = async (id: string) => {
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
      console.error("Failed to copy text:", err)
    }
  }

  const copyCodeToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div
      className={cn(
        "group relative px-4 py-6 transition-colors",
        message.role === "assistant" ? "bg-muted/50 hover:bg-muted" : "bg-background hover:bg-muted/30",
      )}
    >
      <div className="mx-auto flex max-w-3xl space-x-4">
        <div className="flex-shrink-0">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              message.role === "assistant" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
            )}
          >
            {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          {message.isCached && (
            <div className="mt-2 flex justify-center">
              <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                Instant
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full" />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave} className="h-9">
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-9">
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              {(() => {
                if (message.type === "ecommerce" && message.metadata?.products) {
                  return (
                    <div className="mt-4 rounded-xl border bg-background p-4 shadow-sm">
                      <EcommerceView products={message.metadata.products} isLoading={false} query="E-commerce Search Results" />
                    </div>
                  )
                }

                if (message.type === "compare" && message.metadata?.responses) {
                  return (
                    <div className="mt-4 rounded-xl border bg-background p-4 shadow-sm">
                      <CompareView responses={message.metadata.responses} isLoading={false} />
                    </div>
                  )
                }

                const renderContent = typeof message.content === "string" ? message.content : JSON.stringify(message.content, null, 2)

                return message.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="first:mt-0 mb-4 mt-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => <h2 className="first:mt-0 mb-3 mt-6 text-xl font-bold text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="first:mt-0 mb-2 mt-4 text-lg font-semibold text-foreground">{children}</h3>,
                      h4: ({ children }) => <h4 className="mb-2 mt-4 text-base font-semibold text-foreground">{children}</h4>,
                      p: ({ children }) => <p className="mb-4 leading-7 text-foreground last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-6 text-foreground">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-foreground">{children}</ol>,
                      li: ({ children }) => <li className="leading-7">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="my-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground">{children}</blockquote>
                      ),
                      hr: () => <hr className="my-6 border-border" />,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline transition-opacity hover:opacity-80">
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="my-4 overflow-x-auto">
                          <table className="w-full border-collapse border border-border text-sm">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                      th: ({ children }) => <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">{children}</th>,
                      td: ({ children }) => <td className="border border-border px-4 py-2 text-foreground">{children}</td>,
                      code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "")
                        if (!className) {
                          return (
                            <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground" {...props}>
                              {children}
                            </code>
                          )
                        }

                        const language = match ? match[1] : "code"
                        const codeText = extractText(children).replace(/\n$/, "")

                        return (
                          <div className="my-4 overflow-hidden rounded-lg border border-border shadow-sm">
                            <div className="flex items-center justify-between border-b border-border bg-zinc-900 px-4 py-2 dark:bg-zinc-950">
                              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">{language}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1.5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
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
                            <div className="overflow-x-auto bg-zinc-950">
                              <pre className="m-0 bg-transparent p-4">
                                <code className={cn(className, "whitespace-pre font-mono text-sm leading-relaxed text-zinc-100")} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          </div>
                        )
                      },
                      pre: ({ children }) => <>{children}</>,
                    }}
                  >
                    {renderContent}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground">{renderContent}</p>
                )
              })()}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content)} className="h-9 px-3 text-muted-foreground hover:text-foreground" aria-label="Copy message">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-9 px-3 text-muted-foreground hover:text-foreground" aria-label="Edit message">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-destructive" aria-label="Delete message">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Message</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={() => handleDelete(message.id)}>
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
