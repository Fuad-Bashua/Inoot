import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { computeUserPatterns } from "@/lib/patterns"

// GET /api/patterns — returns the computed behavioural patterns for the current user.
// Used by the settings page "What Inoot has learned about you" section.
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
    const patterns = await computeUserPatterns(userId)

    return NextResponse.json({ success: true, data: patterns })
  } catch (error) {
    console.error("Patterns fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to compute patterns" },
      { status: 500 }
    )
  }
}
