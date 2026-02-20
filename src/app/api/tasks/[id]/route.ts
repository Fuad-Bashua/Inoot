import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tasks/[id] — get single task
export async function GET(
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

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        subtasks: { orderBy: { orderIndex: "asc" } },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    // Stamp lastInteractedAt = now, but return the PREVIOUS value so the client
    // can compute how long ago the user was last here (for the "welcome back" card).
    // Fire-and-forget: don't block the response.
    prisma.task
      .update({ where: { id }, data: { lastInteractedAt: new Date() } })
      .catch(console.error)

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] — update task
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

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.targetDate !== undefined && {
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
        }),
        ...(data.reminderAt !== undefined && {
          reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
        }),
        ...(data.lastInteractedAt !== undefined && {
          lastInteractedAt: data.lastInteractedAt ? new Date(data.lastInteractedAt) : null,
        }),
      },
      include: {
        subtasks: { orderBy: { orderIndex: "asc" } },
      },
    })

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] — delete task and all subtasks
export async function DELETE(
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

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    // Cascading delete handles subtasks
    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
