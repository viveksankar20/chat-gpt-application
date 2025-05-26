"use client"

import { useState } from "react"
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

  const handleSave = () => {
    onEdit(message.id, editContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div
      className={cn(
        "group relative px-4 py-6 transition-colors",
        message.role === "assistant" ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50",
      )}
    >
      <div className="max-w-3xl mx-auto flex space-x-4">
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "assistant" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600",
            )}
          >
            {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full" />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {message.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: ({ node, className, children, ...props }) => {
                      // @ts-ignore
                      const isInline = node?.inline === true || node?.type === "inlineCode";
                      if (isInline) {
                        return (
                          <code
                            className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      }
                      return (
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      )
                    },
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-900">{children}</p>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-900 leading-relaxed">{message.content}</p>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Message</DialogTitle>
                  </DialogHeader>
                  <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={() => onDelete(message.id)}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
