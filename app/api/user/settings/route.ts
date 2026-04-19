import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findById(session.user.id).select('-password')
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const updates = await req.json()
    
    // Whitelist allowed fields to update
    const allowedUpdates: any = {}
    if (updates.name !== undefined) allowedUpdates.name = updates.name
    if (updates.avatar !== undefined) allowedUpdates.avatar = updates.avatar
    if (updates.themePreference !== undefined) allowedUpdates.themePreference = updates.themePreference
    if (updates.defaultModel !== undefined) allowedUpdates.defaultModel = updates.defaultModel
    if (updates.autoScroll !== undefined) allowedUpdates.autoScroll = updates.autoScroll

    await connectDB()
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
