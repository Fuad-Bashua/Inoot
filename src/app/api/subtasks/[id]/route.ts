import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// PUT /api/subtasks/[id] — update subtask (mainly for toggling completion)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { id } = await params
    const data = await request.json()

    // Verify subtask belongs to user's task
    const subtask = await prisma.subtask.findFirst({
      where: { id },
      include: { task: true },
    })

    if (!subtask || subtask.task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Subtask not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.subtask.update({
      where: { id },
      data: {
        ...(data.completed !== undefined && {
          completed: data.completed,
          completedAt: data.completed ? new Date() : null,
        }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })

    // Check if all subtasks are now completed — if so, mark task as completed
    if (data.completed) {
      const allSubtasks = await prisma.subtask.findMany({
        where: { taskId: subtask.taskId },
      })
      const allCompleted = allSubtasks.every((s: { id: string; completed: boolean }) => s.id === id ? data.completed : s.completed)

      if (allCompleted) {
        await prisma.task.update({
          where: { id: subtask.taskId },
          data: { status: "COMPLETED" },
        })
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update subtask error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update subtask" },
      { status: 500 }
    )
  }
}
