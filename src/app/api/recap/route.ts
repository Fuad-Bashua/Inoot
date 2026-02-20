import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateContextRecap } from "@/lib/claude"
import prisma from "@/lib/prisma"

// POST /api/recap — generate a context recap for a returning user.
// Takes { taskId, lastInteractedAt } and returns { recap: string }.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { taskId, lastInteractedAt } = await request.json()

    if (!taskId || !lastInteractedAt) {
      return NextResponse.json(
        { success: false, error: "taskId and lastInteractedAt are required" },
        { status: 400 }
      )
    }

    // Fetch task with subtasks (verify ownership)
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { subtasks: { orderBy: { orderIndex: "asc" } } },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    const hoursSince =
      (Date.now() - new Date(lastInteractedAt).getTime()) / (1000 * 60 * 60)

    const completed = task.subtasks.filter((s) => s.completed)
    const remaining = task.subtasks.filter((s) => !s.completed)

    const recap = await generateContextRecap(
      task.title,
      completed,
      remaining,
      hoursSince
    )

    return NextResponse.json({ success: true, data: { recap } })
  } catch (error) {
    console.error("Context recap error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate recap" },
      { status: 500 }
    )
  }
}
