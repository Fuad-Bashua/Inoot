import prisma from "./prisma"

// Derive the element type from the Prisma query so TypeScript can infer
// callback parameters throughout this file without importing Prisma namespaces.
type TaskWithSubtasks = Awaited<
  ReturnType<typeof prisma.task.findMany<{ include: { subtasks: true } }>>
>[number]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserPatterns {
  /** Number of tasks the user has created. Patterns are only reliable once taskCount >= 3. */
  taskCount: number
  /** Hour range when the user most often creates or interacts with tasks. */
  mostActiveTimeOfDay: "morning" | "afternoon" | "evening" | "night" | null
  /** The category that appears most in the user's task history. */
  dominantCategory: "ACADEMIC" | "CAREER" | "PERSONAL" | null
  /** Fraction of subtasks completed across all tasks (0.0 – 1.0). */
  avgCompletionRate: number
  /** Inferred preference based on average subtask count per task. */
  preferredComplexity: "simple" | "moderate" | "complex"
  /** How often the user pauses tasks relative to total tasks created. */
  pauseFrequency: "low" | "moderate" | "high"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeOfDay(
  hour: number
): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}

const defaultPatterns = (taskCount: number): UserPatterns => ({
  taskCount,
  mostActiveTimeOfDay: null,
  dominantCategory: null,
  avgCompletionRate: 0,
  preferredComplexity: "moderate",
  pauseFrequency: "low",
})

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Derives behavioural patterns for a given user from their existing task and
 * subtask data. Requires at least 3 tasks before returning meaningful insight —
 * below that threshold the function returns safe defaults so the prompt is
 * unaffected for brand-new users.
 */
export async function computeUserPatterns(
  userId: string
): Promise<UserPatterns> {
  const tasks: TaskWithSubtasks[] = await prisma.task.findMany({
    where: { userId },
    include: { subtasks: true },
    orderBy: { createdAt: "desc" },
    take: 50, // Only look at the last 50 tasks for relevance
  })

  if (tasks.length < 3) {
    return defaultPatterns(tasks.length)
  }

  // ── Most active time of day ─────────────────────────────────────────────────
  const timeCounts: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  }
  tasks.forEach((t) => {
    timeCounts[getTimeOfDay(new Date(t.createdAt).getHours())]++
  })
  const mostActiveTimeOfDay = Object.entries(timeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as UserPatterns["mostActiveTimeOfDay"]

  // ── Dominant category ──────────────────────────────────────────────────────
  const categoryCounts: Record<string, number> = {
    ACADEMIC: 0,
    CAREER: 0,
    PERSONAL: 0,
  }
  tasks.forEach((t) => {
    categoryCounts[t.category]++
  })
  const dominantCategory = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as UserPatterns["dominantCategory"]

  // ── Average subtask completion rate ───────────────────────────────────────
  const allSubtasks = tasks.flatMap((t) => t.subtasks)
  const avgCompletionRate =
    allSubtasks.length > 0
      ? allSubtasks.filter((s) => s.completed).length / allSubtasks.length
      : 0

  // ── Preferred complexity ───────────────────────────────────────────────────
  // Inferred from average number of subtasks across tasks that have been broken down
  const tasksWithSubtasks = tasks.filter((t) => t.subtasks.length > 0)
  const avgSubtasksPerTask =
    tasksWithSubtasks.length > 0
      ? tasksWithSubtasks.reduce((sum: number, t) => sum + t.subtasks.length, 0) /
        tasksWithSubtasks.length
      : 4 // Neutral default

  const preferredComplexity: UserPatterns["preferredComplexity"] =
    avgSubtasksPerTask <= 3
      ? "simple"
      : avgSubtasksPerTask <= 5
      ? "moderate"
      : "complex"

  // ── Pause frequency ────────────────────────────────────────────────────────
  // Count tasks that are currently paused as a proportion of total
  const pausedCount = tasks.filter((t) => t.status === "PAUSED").length
  const pauseRate = pausedCount / tasks.length
  const pauseFrequency: UserPatterns["pauseFrequency"] =
    pauseRate > 0.4 ? "high" : pauseRate > 0.15 ? "moderate" : "low"

  return {
    taskCount: tasks.length,
    mostActiveTimeOfDay,
    dominantCategory,
    avgCompletionRate,
    preferredComplexity,
    pauseFrequency,
  }
}
