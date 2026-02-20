"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { ProgressBar } from "@/components/feedback/ProgressBar"
import { SubtaskItem } from "@/components/task/SubtaskItem"
import { NextActionStep, AllDoneMessage } from "@/components/task/NextActionStep"
import { TaskActions } from "@/components/task/TaskActions"
import { ReminderPicker } from "@/components/task/ReminderPicker"
import { WelcomeBackCard } from "@/components/task/WelcomeBackCard"
import {
  MissedDeadlineCard,
  shouldShowDeadlineCard,
} from "@/components/task/MissedDeadlineCard"
import { Task, Subtask } from "@/types/task"
import {
  getCategoryColour,
  getCategoryLabel,
  getProgressPercentage,
} from "@/lib/utils"

// ── Constants ────────────────────────────────────────────────────────────────

/** Hours of absence before the "Welcome back" card appears */
const WELCOME_BACK_THRESHOLD_HOURS = 24

// ── Progress milestone messages (T19) ────────────────────────────────────────

function getMilestoneMessage(
  prevCompleted: number,
  nextCompleted: number,
  total: number
): string | null {
  if (total === 0) return null
  const prevPct = (prevCompleted / total) * 100
  const nextPct = (nextCompleted / total) * 100

  if (prevCompleted === 0 && nextCompleted === 1) return "Great start — you're moving."
  if (prevPct < 25 && nextPct >= 25) return "Quarter of the way there."
  if (prevPct < 50 && nextPct >= 50) return "Halfway done — solid progress."
  if (prevPct < 75 && nextPct >= 75) return "Nearly there now."
  // 100% handled separately by the all-done message
  return null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

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

// ── Main content ──────────────────────────────────────────────────────────────

function TaskPageContent({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // T19 — progress milestone messages
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null)
  const milestoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Whether the user has encouraged messages turned on (default true)
  const [showEncouragement, setShowEncouragement] = useState(true)

  // T18 — context recap / welcome back
  const [lastInteractedAt, setLastInteractedAt] = useState<string | null>(null)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)

  // T20 — missed deadline (compute after task loads, client-side check)
  const [showDeadlineCard, setShowDeadlineCard] = useState(false)

  // Fetch task data + preferences in parallel
  const fetchTask = useCallback(async () => {
    try {
      const [taskRes, prefRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch("/api/preferences"),
      ])

      // Preferences (non-critical — default to showing encouragement if fails)
      if (prefRes.ok) {
        const prefData = await prefRes.json()
        if (prefData.success && prefData.data) {
          setShowEncouragement(prefData.data.showEncouragement !== false)
        }
      }

      if (taskRes.status === 404) { setNotFound(true); return }
      const data = await taskRes.json()
      if (!data.success) { setNotFound(true); return }

      const t: Task = data.data
      setTask(t)
      setSubtasks(t.subtasks)

      // T18 — decide whether to show welcome back card
      if (t.lastInteractedAt) {
        const hoursSince =
          (Date.now() - new Date(t.lastInteractedAt).getTime()) / (1000 * 60 * 60)
        if (hoursSince >= WELCOME_BACK_THRESHOLD_HOURS) {
          setLastInteractedAt(t.lastInteractedAt)
          setShowWelcomeBack(true)
        }
      }

      // T20 — check missed deadline (uses localStorage to respect dismissal)
      setShowDeadlineCard(shouldShowDeadlineCard(t.id, t.targetDate))
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTask()
    return () => {
      if (milestoneTimer.current) clearTimeout(milestoneTimer.current)
    }
  }, [fetchTask])

  // ── Subtask completion handler ────────────────────────────────────────────

  function showMilestone(msg: string) {
    if (!showEncouragement) return
    setMilestoneMessage(msg)
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current)
    milestoneTimer.current = setTimeout(() => setMilestoneMessage(null), 4000)
  }

  function handleSubtaskToggle(subtaskId: string, completed: boolean) {
    setSubtasks((prev) => {
      const prevCompleted = prev.filter((s) => s.completed).length
      const updated = prev.map((s) =>
        s.id === subtaskId
          ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null }
          : s
      )
      const nextCompleted = updated.filter((s) => s.completed).length

      // T19 — check milestones
      if (completed) {
        const allDone = updated.every((s) => s.completed)
        if (allDone) {
          setTask((t) => (t ? { ...t, status: "COMPLETED" } : t))
          // All-done message handled by AllDoneMessage component; no milestone needed
        } else {
          const milestone = getMilestoneMessage(prevCompleted, nextCompleted, prev.length)
          if (milestone) {
            showMilestone(milestone)
          } else {
            // Non-milestone completion — brief "nice one" transition
            showMilestone("Nice one — here's your next step.")
          }
        }
      }

      return updated
    })
  }

  function handleNextActionComplete(subtaskId: string) {
    handleSubtaskToggle(subtaskId, true)
  }

  function handleStatusChange(newStatus: Task["status"]) {
    setTask((t) => (t ? { ...t, status: newStatus } : t))
  }

  function handleReminderUpdate(newReminderAt: string | null) {
    setTask((t) => (t ? { ...t, reminderAt: newReminderAt } : t))
  }

  async function handleSetNewTargetDate(date: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDate: date }),
    })
    if (!res.ok) throw new Error("Failed to update date")
    const data = await res.json()
    setTask((t) => (t ? { ...t, targetDate: data.data.targetDate } : t))
    setShowDeadlineCard(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <TaskPageSkeleton />

  if (notFound || !task) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-[#2D3436] font-medium">This task doesn&apos;t seem to exist.</p>
        <p className="text-sm text-[#636E72]">
          It may have been deleted, or the link might be wrong.
        </p>
        <Link
          href="/dashboard"
          className="inline-block text-sm text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors
                     focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
        >
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const progress = getProgressPercentage(subtasks)
  const nextSubtask =
    subtasks
      .filter((s) => !s.completed)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null
  const remainingSubtasks = subtasks
    .filter((s) => !s.completed && s.id !== nextSubtask?.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  const completedSubtasks = subtasks.filter((s) => s.completed)
  const categoryColour = getCategoryColour(task.category)
  const categoryLabel = getCategoryLabel(task.category)
  const isPersonal = task.category === "PERSONAL"

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors
                   inline-flex items-center gap-1.5
                   focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
        aria-label="Back to dashboard"
      >
        ← Back
      </Link>

      {/* T18 — Welcome back card (only when returning after 24+ hours) */}
      {showWelcomeBack && lastInteractedAt && (
        <WelcomeBackCard
          taskId={task.id}
          taskTitle={task.title}
          subtasks={subtasks}
          lastInteractedAt={lastInteractedAt}
          onDismiss={() => setShowWelcomeBack(false)}
          onReplan={() => {
            setShowWelcomeBack(false)
            fetchTask()
          }}
        />
      )}

      {/* T20 — Missed deadline card (never says "overdue") */}
      {showDeadlineCard && task.targetDate && task.status !== "COMPLETED" && (
        <MissedDeadlineCard
          taskId={task.id}
          targetDate={task.targetDate}
          onSetNewDate={handleSetNewTargetDate}
        />
      )}

      {/* Title + category badge */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-3 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: categoryColour,
              color: isPersonal ? "#2D3436" : "white",
            }}
          >
            {categoryLabel}
          </span>
          {task.status === "PAUSED" && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#DFE6E9] text-[#636E72]">
              Paused
            </span>
          )}
          {task.status === "COMPLETED" && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#81C995]/20 text-[#4A9E6B]">
              ✓ Completed
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436] leading-snug">
          {task.title}
        </h1>

        {/* Reminder picker — subtle, below title */}
        <ReminderPicker
          taskId={task.id}
          reminderAt={task.reminderAt}
          onUpdate={handleReminderUpdate}
        />
      </div>

      {/* Progress bar + milestone message (T19) */}
      <div className="space-y-2" aria-label={`Task progress: ${progress}% complete`}>
        <ProgressBar progress={progress} />
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-[#636E72]">
            {completedSubtasks.length} of {subtasks.length} steps done
          </p>
        </div>

        {/* T19 — milestone / transition message */}
        {milestoneMessage && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-[#636E72] leading-relaxed
                       animate-[fadeIn_0.4s_ease-in-out]"
          >
            {milestoneMessage}
          </p>
        )}
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

      {/* ── Next action + remaining subtasks ─────────────────────────── */}
      <div className="space-y-2" aria-live="polite" aria-label="Task steps">
        {subtasks.length === 0 ? (
          <p className="text-sm text-[#636E72]">
            No steps yet. Try re-breaking down this task.
          </p>
        ) : nextSubtask ? (
          <NextActionStep subtask={nextSubtask} onComplete={handleNextActionComplete} />
        ) : (
          <AllDoneMessage />
        )}

        {/* Coming up: remaining uncompleted subtasks (de-emphasised) */}
        {remainingSubtasks.length > 0 && (
          <section aria-label="Upcoming steps">
            <p className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wide mt-8 mb-1">
              Coming up
            </p>
            <ul className="divide-y divide-[#DFE6E9] opacity-50">
              {remainingSubtasks.map((s) => (
                <SubtaskItem
                  key={s.id}
                  subtask={s}
                  isPreview
                  onToggle={handleSubtaskToggle}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Done: completed subtasks */}
        {completedSubtasks.length > 0 && (
          <section aria-label="Completed steps">
            <p
              className="text-xs font-medium text-[#81C995] uppercase tracking-wide mt-8 mb-1
                         flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M2 7l4 4 6-6"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Done
            </p>
            <ul className="divide-y divide-[#DFE6E9]">
              {completedSubtasks.map((s) => (
                <SubtaskItem key={s.id} subtask={s} onToggle={handleSubtaskToggle} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Task actions */}
      <div className="pt-4 border-t border-[#DFE6E9]">
        <TaskActions
          task={{ ...task, subtasks }}
          onStatusChange={handleStatusChange}
        />
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
