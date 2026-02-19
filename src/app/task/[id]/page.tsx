"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { ProgressBar } from "@/components/feedback/ProgressBar"
import { SubtaskItem } from "@/components/task/SubtaskItem"
import { NextActionStep, AllDoneMessage } from "@/components/task/NextActionStep"
import { TaskActions } from "@/components/task/TaskActions"
import { Task, Subtask } from "@/types/task"
import {
  getCategoryColour,
  getCategoryLabel,
  getProgressPercentage,
} from "@/lib/utils"

function TaskPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-24 bg-[#DFE6E9] rounded" />
      <div className="space-y-3">
        <div className="h-6 w-3/4 bg-[#DFE6E9] rounded-lg" />
        <div className="h-3 w-1/4 bg-[#DFE6E9] rounded-full" />
      </div>
      <div className="h-24 bg-[#DFE6E9] rounded-xl" />
      <div className="h-20 bg-[#DFE6E9] rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-[#DFE6E9] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function TaskPageContent({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [encouragement, setEncouragement] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      if (!data.success) {
        setNotFound(true)
        return
      }
      const t: Task = data.data
      setTask(t)
      setSubtasks(t.subtasks)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  function handleSubtaskToggle(subtaskId: string, completed: boolean) {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null } : s
      )
    )
    // If all completed, update task status locally
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed } : s
    )
    if (updated.every((s) => s.completed)) {
      setTask((t) => (t ? { ...t, status: "COMPLETED" } : t))
      setEncouragement("You've finished everything. That's a real accomplishment — well done.")
    }
  }

  function handleNextActionComplete(subtaskId: string) {
    handleSubtaskToggle(subtaskId, true)
  }

  function handleStatusChange(newStatus: Task["status"]) {
    setTask((t) => (t ? { ...t, status: newStatus } : t))
  }

  if (loading) return <TaskPageSkeleton />

  if (notFound || !task) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-[#2D3436] font-medium">This task doesn&apos;t seem to exist.</p>
        <p className="text-sm text-[#636E72]">It may have been deleted, or the link might be wrong.</p>
        <Link
          href="/dashboard"
          className="inline-block text-sm text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
        >
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const progress = getProgressPercentage(subtasks)
  const nextSubtask =
    subtasks.filter((s) => !s.completed).sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null
  const remainingSubtasks = subtasks.filter((s) => !s.completed && s.id !== nextSubtask?.id)
  const completedSubtasks = subtasks.filter((s) => s.completed)
  const categoryColour = getCategoryColour(task.category)
  const categoryLabel = getCategoryLabel(task.category)

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
        aria-label="Back to dashboard"
      >
        ← Back
      </Link>

      {/* Title + category badge */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-3 py-1 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: categoryColour }}
          >
            {categoryLabel}
          </span>
          {task.status === "PAUSED" && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#DFE6E9] text-[#636E72]">
              Paused
            </span>
          )}
          {task.status === "COMPLETED" && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#81C995]/20 text-[#81C995]">
              Completed
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436] leading-snug">
          {task.title}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="space-y-2" aria-label={`Task progress: ${progress}% complete`}>
        <ProgressBar progress={progress} />
        <p className="text-sm text-[#636E72]">
          {completedSubtasks.length} of {subtasks.length} steps done
        </p>
      </div>

      {/* AI Guidance callout */}
      {task.aiGuidance && (
        <div
          className="px-5 py-4 rounded-xl bg-[#A8C5B8]/10 border border-[#A8C5B8]/20"
          role="note"
          aria-label="Guidance for this task"
        >
          <p className="text-sm text-[#636E72] leading-relaxed">{task.aiGuidance}</p>
        </div>
      )}

      {/* Next action + remaining subtasks */}
      <div
        className="space-y-2"
        aria-live="polite"
        aria-label="Task steps"
      >
        {subtasks.length === 0 ? (
          <p className="text-sm text-[#636E72]">No steps yet. Try re-breaking down this task.</p>
        ) : nextSubtask ? (
          <NextActionStep
            subtask={nextSubtask}
            onComplete={handleNextActionComplete}
          />
        ) : (
          <AllDoneMessage />
        )}

        {/* Remaining uncompleted subtasks */}
        {remainingSubtasks.length > 0 && (
          <section aria-label="Upcoming steps">
            <p className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wide mt-6 mb-1">
              Coming up
            </p>
            <ul className="divide-y divide-[#DFE6E9]">
              {remainingSubtasks.map((s) => (
                <SubtaskItem
                  key={s.id}
                  subtask={s}
                  onToggle={handleSubtaskToggle}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Completed subtasks */}
        {completedSubtasks.length > 0 && (
          <section aria-label="Completed steps">
            <p className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wide mt-6 mb-1">
              Completed
            </p>
            <ul className="divide-y divide-[#DFE6E9]">
              {completedSubtasks.map((s) => (
                <SubtaskItem
                  key={s.id}
                  subtask={s}
                  onToggle={handleSubtaskToggle}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* AI encouragement */}
      {encouragement && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm italic text-[#636E72] text-center leading-relaxed"
        >
          {encouragement}
        </p>
      )}

      {/* Task actions */}
      <div className="pt-4 border-t border-[#DFE6E9]">
        <TaskActions task={{ ...task, subtasks }} onStatusChange={handleStatusChange} />
      </div>
    </div>
  )
}

export default function TaskPage() {
  const params = useParams()
  const taskId = typeof params.id === "string" ? params.id : ""

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <TaskPageContent taskId={taskId} />
        </main>
      </div>
    </AuthGuard>
  )
}
