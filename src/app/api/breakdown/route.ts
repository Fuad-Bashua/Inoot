import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateTaskBreakdown } from "@/lib/claude"
import prisma from "@/lib/prisma"

// POST /api/breakdown — send task to Claude, get breakdown, save subtasks
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
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    // Call Claude API
    const breakdown = await generateTaskBreakdown(
      task.title,
      task.description || "",
      task.category
    )

    // Delete existing subtasks (in case of re-breakdown)
    await prisma.subtask.deleteMany({
      where: { taskId },
    })

    // Create new subtasks from AI response
    const subtasks = await Promise.all(
      breakdown.subtasks.map((subtask, index) =>
        prisma.subtask.create({
          data: {
            title: subtask.title,
            description: subtask.description,
            estimatedMinutes: subtask.estimatedMinutes,
            orderIndex: index,
            taskId,
          },
        })
      )
    )

    // Update task with AI guidance
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: breakdown.taskTitle,
        aiGuidance: breakdown.guidance,
      },
      include: {
        subtasks: { orderBy: { orderIndex: "asc" } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        task: updatedTask,
        encouragement: breakdown.encouragement,
      },
    })
  } catch (error) {
    console.error("Breakdown error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate task breakdown. Please try again.",
      },
      { status: 500 }
    )
  }
}
