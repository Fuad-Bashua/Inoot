import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    })

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// PUT /api/preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const data = await request.json()

    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error("Update preferences error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
