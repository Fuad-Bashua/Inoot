import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tasks — get all tasks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const where: any = { userId }
    if (category && category !== "ALL") where.category = category
    if (status) where.status = status

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

// POST /api/tasks — create a new task (WITHOUT AI breakdown)
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
    const { title, description, category, targetDate } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "PERSONAL",
        targetDate: targetDate ? new Date(targetDate) : null,
        userId,
      },
      include: {
        subtasks: true,
      },
    })

    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    )
  }
}
