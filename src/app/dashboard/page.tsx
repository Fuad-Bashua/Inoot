"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CategoryFilter,
  FilterCategory,
  CategoryCounts,
} from "@/components/task/CategoryFilter"
import { TaskCard } from "@/components/task/TaskCard"
import { EmptyState } from "@/components/task/EmptyState"
import {
  EnergySelector,
  EnergyMode,
  getStoredEnergyMode,
  storeEnergyMode,
} from "@/components/dashboard/EnergySelector"
import { Task } from "@/types/task"
import { cn } from "@/lib/utils"

// Task-list limits per energy mode
const LOW_ENERGY_TASK_LIMIT = 3
const NORMAL_TASK_LIMIT = 6 // Focused mode shows all

// ─── Rotating greeting subtitles (opt-in feature) ──────────────────────────
const OPTIONAL_GREETINGS = [
  "Picking this up again is a win in itself.",
  "Ready when you are.",
  "Let's take things one step at a time.",
  "You're here — that's the first step done already.",
] as const

const GREETING_SESSION_KEY = "inoot_greeting_idx"

function pickRotatingGreeting(): string {
  try {
    const raw = sessionStorage.getItem(GREETING_SESSION_KEY)
    const lastIdx = raw !== null ? parseInt(raw, 10) : -1
    const nextIdx = (lastIdx + 1) % OPTIONAL_GREETINGS.length
    sessionStorage.setItem(GREETING_SESSION_KEY, String(nextIdx))
    return OPTIONAL_GREETINGS[nextIdx]
  } catch {
    return OPTIONAL_GREETINGS[0]
  }
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function TaskGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3"
        >
          <div className="h-4 w-20 bg-[#DFE6E9] rounded-full animate-pulse" />
          <div className="h-5 w-3/4 bg-[#DFE6E9] rounded-lg animate-pulse" />
          <div className="h-2 w-full bg-[#DFE6E9] rounded-full animate-pulse" />
          <div className="h-3 w-24 bg-[#DFE6E9] rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ─── Reminder banner ────────────────────────────────────────────────────────
interface ReminderBannerProps {
  task: Task
  onDismiss: (taskId: string) => void
}

function ReminderBanner({ task, onDismiss }: ReminderBannerProps) {
  const router = useRouter()
  return (
    <div
      className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl
                 bg-[#6B8F9E]/10 border border-[#6B8F9E]/20"
      role="note"
      aria-label={`Reminder for task: ${task.title}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {/* Bell icon */}
        <svg
          className="w-4 h-4 text-[#6B8F9E] flex-none mt-0.5"
          fill="none"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2L2 10h12l-1.5-2v-2A4.5 4.5 0 0 0 8 1.5ZM6.5 13a1.5 1.5 0 0 0 3 0"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm text-[#2D3436] leading-snug">
          You set a reminder for{" "}
          <strong className="font-medium">{task.title}</strong>{" "}
          — want to pick it up?
        </p>
      </div>
      <div className="flex items-center gap-1 flex-none">
        <button
          type="button"
          onClick={() => router.push(`/task/${task.id}`)}
          className="text-xs font-medium text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors
                     min-h-[36px] px-2 rounded focus-visible:outline-2 focus-visible:outline-[#6B8F9E]"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => onDismiss(task.id)}
          aria-label={`Dismiss reminder for ${task.title}`}
          className="p-1.5 text-[#B2BEC3] hover:text-[#636E72] transition-colors rounded
                     min-h-[36px] min-w-[36px] flex items-center justify-center
                     focus-visible:outline-2 focus-visible:outline-[#6B8F9E]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Greeting subtitle per energy mode ────────────────────────────────────────
function getSubtitle(mode: EnergyMode): string {
  if (mode === "focused") return "You're in focused mode — let's make it count."
  if (mode === "low") return "Taking it easy today. That's completely fine."
  return "Here's what you're working on."
}

// ─── Dashboard page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession()

  // ALL tasks fetched once — filtering is done client-side for instant response
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // IDs of reminders the user has dismissed this session
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([])
  // Energy mode — read from localStorage on mount, defaults to "normal"
  const [energyMode, setEnergyMode] = useState<EnergyMode>("normal")
  // "Show more" toggles per mode
  const [showAllLowEnergy, setShowAllLowEnergy] = useState(false)
  const [showAllNormal, setShowAllNormal] = useState(false)
  // Optional greeting (shown when showOptionalEncouragement is on)
  const [optionalGreeting, setOptionalGreeting] = useState<string | null>(null)

  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  // Read stored energy mode once on client mount
  useEffect(() => {
    setEnergyMode(getStoredEnergyMode())
  }, [])

  // Fetch preference to decide whether to show rotating greeting
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.showOptionalEncouragement === true) {
          setOptionalGreeting(pickRotatingGreeting())
        }
      })
      .catch(() => {})
  }, [])

  function handleEnergyChange(mode: EnergyMode) {
    setEnergyMode(mode)
    storeEnergyMode(mode)
    // Reset "show all" toggles whenever mode changes
    setShowAllLowEnergy(false)
    setShowAllNormal(false)
  }

  // ── Fetch all tasks once ─────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tasks")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAllTasks(data.data ?? [])
    } catch {
      setError("Couldn't load your tasks right now. Give it a moment and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ── Due reminders ────────────────────────────────────────────────────────
  const dueReminders = useMemo(() => {
    const now = new Date()
    return allTasks.filter(
      (t) =>
        t.reminderAt &&
        new Date(t.reminderAt) <= now &&
        !dismissedReminders.includes(t.id)
    )
  }, [allTasks, dismissedReminders])

  function handleDismissReminder(taskId: string) {
    setDismissedReminders((prev) => [...prev, taskId])
  }

  // ── Derived state ────────────────────────────────────────────────────────
  const { activeTasks, pausedTasks, counts } = useMemo(() => {
    const active = allTasks.filter((t) => t.status !== "PAUSED")
    const paused = allTasks.filter((t) => t.status === "PAUSED")

    const filterByCategory = (tasks: Task[]) =>
      selectedCategory === "ALL"
        ? tasks
        : tasks.filter((t) => t.category === selectedCategory)

    const counts: CategoryCounts = {
      ALL: allTasks.length,
      ACADEMIC: allTasks.filter((t) => t.category === "ACADEMIC").length,
      CAREER: allTasks.filter((t) => t.category === "CAREER").length,
      PERSONAL: allTasks.filter((t) => t.category === "PERSONAL").length,
    }

    return {
      activeTasks: filterByCategory(active),
      pausedTasks: filterByCategory(paused),
      counts,
    }
  }, [allTasks, selectedCategory])

  // Cap active tasks depending on energy mode
  const visibleActiveTasks = useMemo(() => {
    if (energyMode === "low" && !showAllLowEnergy) {
      return activeTasks.slice(0, LOW_ENERGY_TASK_LIMIT)
    }
    if (energyMode === "normal" && !showAllNormal) {
      return activeTasks.slice(0, NORMAL_TASK_LIMIT)
    }
    // "focused" mode (or user expanded) — show everything
    return activeTasks
  }, [activeTasks, energyMode, showAllLowEnergy, showAllNormal])

  const hiddenCount = useMemo(() => {
    if (energyMode === "low" && !showAllLowEnergy) {
      return Math.max(0, activeTasks.length - LOW_ENERGY_TASK_LIMIT)
    }
    if (energyMode === "normal" && !showAllNormal) {
      return Math.max(0, activeTasks.length - NORMAL_TASK_LIMIT)
    }
    return 0
  }, [activeTasks, energyMode, showAllLowEnergy, showAllNormal])

  return (
    <div className="flex flex-col gap-8 pb-28 sm:pb-0">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436]">
            Hey, {firstName}
          </h1>
          <p className="text-sm text-[#636E72] mt-1 leading-relaxed">
            {/* Energy mode always wins; fall back to rotating greeting or default */}
            {energyMode !== "normal"
              ? getSubtitle(energyMode)
              : optionalGreeting ?? getSubtitle(energyMode)}
          </p>
        </div>

        {/* Desktop CTA — hidden on mobile (sticky button used instead) */}
        <Link
          href="/task/new"
          className="hidden sm:flex items-center shrink-0 min-h-[44px] px-4 py-2.5
                     bg-[#6B8F9E] text-white rounded-xl text-sm font-medium
                     hover:bg-[#5A7D8C] transition-colors whitespace-nowrap"
        >
          + New task
        </Link>
      </div>

      {/* ── Energy selector ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wide">
          How are you feeling today?
        </p>
        <EnergySelector value={energyMode} onChange={handleEnergyChange} />
      </div>

      {/* ── Reminder banners — shown for due reminders ───────────────────── */}
      {dueReminders.length > 0 && (
        <div className="space-y-2" aria-live="polite" aria-label="Task reminders">
          {dueReminders.map((task) => (
            <ReminderBanner
              key={task.id}
              task={task}
              onDismiss={handleDismissReminder}
            />
          ))}
        </div>
      )}

      {/* ── Low energy nudge ─────────────────────────────────────────────── */}
      {energyMode === "low" && !loading && activeTasks.length > 0 && (
        <div
          className="px-4 py-3 rounded-xl bg-[#A8C5B8]/10 border border-[#A8C5B8]/20 text-sm text-[#636E72] leading-relaxed"
          role="note"
        >
          🌙{" "}
          <span>
            On low energy days, just picking one task is more than enough.
            No need to look at everything — take it one step at a time.
          </span>
        </div>
      )}

      {/* ── Category filter ──────────────────────────────────────────────── */}
      <CategoryFilter
        selected={selectedCategory}
        onChange={setSelectedCategory}
        counts={loading ? undefined : counts}
      />

      {/* ── Main task list ───────────────────────────────────────────────── */}
      <section aria-live="polite" aria-label="Your tasks" className="space-y-10">
        {loading ? (
          <TaskGridSkeleton />
        ) : error ? (
          <div className="py-12 text-center" role="alert">
            <p className="text-[#636E72] text-sm">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-4 min-h-[44px] px-4 text-sm text-[#6B8F9E]
                         hover:text-[#5A7D8C] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Active + Completed tasks */}
            {visibleActiveTasks.length === 0 && pausedTasks.length === 0 ? (
              <EmptyState category={selectedCategory} />
            ) : visibleActiveTasks.length === 0 ? null : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleActiveTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>

                {/* "Show more" disclosure — varies by energy mode */}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      energyMode === "low"
                        ? setShowAllLowEnergy(true)
                        : setShowAllNormal(true)
                    }
                    className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors
                               focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
                  >
                    {hiddenCount === 1
                      ? "1 more task"
                      : `${hiddenCount} more tasks`}{" "}
                    {energyMode === "low"
                      ? "— here when you're ready, no rush."
                      : "— show them all."}
                  </button>
                )}
              </div>
            )}

            {/* ── Paused tasks — subtle section below active tasks ──────── */}
            {pausedTasks.length > 0 && (
              <div className="space-y-4">
                {/* Section label */}
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wide">
                    Taking a break
                  </p>
                  <div className="flex-1 border-t border-[#DFE6E9]" aria-hidden="true" />
                </div>

                <p className="text-xs text-[#B2BEC3] -mt-2">
                  These are here whenever you&apos;re ready to come back to them.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {pausedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when filter has no ACTIVE tasks but has PAUSED ones */}
            {visibleActiveTasks.length === 0 && pausedTasks.length > 0 && (
              <p className="text-sm text-[#636E72] text-center">
                All your{" "}
                {selectedCategory !== "ALL"
                  ? selectedCategory.toLowerCase()
                  : ""}{" "}
                tasks are paused right now — that&apos;s completely fine.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── Sticky bottom CTA — mobile only ─────────────────────────────── */}
      <div
        className={cn(
          "sm:hidden fixed bottom-0 left-0 right-0 z-40",
          "bg-white border-t border-[#DFE6E9] px-4 pb-4 pt-3 safe-area-bottom"
        )}
      >
        <Link
          href="/task/new"
          className="flex items-center justify-center w-full min-h-[48px]
                     bg-[#6B8F9E] text-white rounded-xl text-base font-medium
                     hover:bg-[#5A7D8C] transition-colors"
        >
          + New task
        </Link>
      </div>
    </div>
  )
}
