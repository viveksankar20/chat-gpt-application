import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongoose"
import { Chat } from "@/models/chat.model"

export default async function NewChatPage() {
  // Create a new chat on the server
  await connectDB()

  const newChat = new Chat({
    title: "New Chat",
    userId: "default-user",
  })

  await newChat.save()

  // Redirect to the new chat
  redirect(`/chat/${newChat._id.toString()}`)
}
