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
// Accepts a partial update — only the fields listed below are allowed.
// All values are explicitly validated before reaching Prisma, preventing
// runtime errors from unknown keys or wrong types.
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
    const body = await request.json()

    // Build a safe, validated update object — only known Prisma fields allowed
    const update: Record<string, unknown> = {}

    if ("tonePreference" in body) {
      const allowed = ["SUPPORTIVE", "STRUCTURED", "CASUAL"]
      if (allowed.includes(String(body.tonePreference))) {
        update.tonePreference = String(body.tonePreference)
      }
    }

    if ("taskDetailLevel" in body && typeof body.taskDetailLevel === "string") {
      update.taskDetailLevel = body.taskDetailLevel
    }

    if ("reminderFrequency" in body && typeof body.reminderFrequency === "string") {
      update.reminderFrequency = body.reminderFrequency
    }

    if ("workloadLevel" in body && typeof body.workloadLevel === "string") {
      update.workloadLevel = body.workloadLevel
    }

    if ("showEncouragement" in body && typeof body.showEncouragement === "boolean") {
      update.showEncouragement = body.showEncouragement
    }

    if ("showOptionalEncouragement" in body && typeof body.showOptionalEncouragement === "boolean") {
      update.showOptionalEncouragement = body.showOptionalEncouragement
    }

    if ("fontSizePreference" in body && typeof body.fontSizePreference === "string") {
      update.fontSizePreference = body.fontSizePreference
    }

    if ("reducedMotion" in body && typeof body.reducedMotion === "boolean") {
      update.reducedMotion = body.reducedMotion
    }

    if ("highContrast" in body && typeof body.highContrast === "boolean") {
      update.highContrast = body.highContrast
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      update,
      create: { userId, ...update },
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
