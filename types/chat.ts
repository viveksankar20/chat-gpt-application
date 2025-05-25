export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ChatResponse extends ApiResponse {
  chat?: Chat
  chats?: Chat[]
}

export interface MessageResponse extends ApiResponse {
  messageData?: Message
  messages?: Message[]
  userMessage?: Message
  assistantMessage?: Message
}
