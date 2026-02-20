"use client"

import { useState, useEffect } from "react"
import { Task, Subtask } from "@/types/task"
import { cn } from "@/lib/utils"

interface WelcomeBackCardProps {
  taskId: string
  taskTitle: string
  subtasks: Subtask[]
  /** ISO string of when the user last interacted with this task */
  lastInteractedAt: string
  onDismiss: () => void
  onReplan: () => void
}

function HoursAgo(lastInteractedAt: string): number {
  return (Date.now() - new Date(lastInteractedAt).getTime()) / (1000 * 60 * 60)
}

function formatTimeSince(hours: number): string {
  if (hours >= 24 * 14) return `${Math.floor(hours / (24 * 7))} weeks`
  if (hours >= 24 * 7) return "over a week"
  if (hours >= 48) return `${Math.floor(hours / 24)} days`
  if (hours >= 24) return "about a day"
  return `${Math.round(hours)} hours`
}

export function WelcomeBackCard({
  taskId,
  lastInteractedAt,
  subtasks,
  onDismiss,
  onReplan,
}: WelcomeBackCardProps) {
  const [recap, setRecap] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replanning, setReplanning] = useState(false)

  const hoursSince = HoursAgo(lastInteractedAt)
  const isLongAbsence = hoursSince >= 24 * 7 // 7+ days

  useEffect(() => {
    let cancelled = false

    async function fetchRecap() {
      try {
        const res = await fetch("/api/recap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, lastInteractedAt }),
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setRecap(data.data.recap)
        }
      } catch {
        // Silently degrade — just skip the recap text
        if (!cancelled) setRecap(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRecap()
    return () => {
      cancelled = true
    }
  }, [taskId, lastInteractedAt])

  async function handleReplan() {
    setReplanning(true)
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })
      if (res.ok) {
        onReplan()
      }
    } catch {
      /* silently ignore — user can retry via edit page */
    } finally {
      setReplanning(false)
    }
  }

  const remaining = subtasks.filter((s) => !s.completed)

  return (
    <div
      className="relative rounded-xl border border-[#A8C5B8]/30 bg-[#A8C5B8]/8 px-5 py-4 space-y-3"
      role="note"
      aria-label="Welcome back to this task"
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss welcome back card"
        className={cn(
          "absolute top-3 right-3 p-1.5 rounded text-[#B2BEC3] hover:text-[#636E72]",
          "transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center",
          "focus-visible:outline-2 focus-visible:outline-[#6B8F9E]"
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Header */}
      <div className="pr-8">
        <p className="text-xs font-medium text-[#6B8F9E] uppercase tracking-wide">
          Welcome back
        </p>
        {isLongAbsence && (
          <p className="text-xs text-[#636E72] mt-1 leading-relaxed">
            It&apos;s been a little while since you looked at this —
            that&apos;s completely fine. Here&apos;s where you left off.
          </p>
        )}
        {!isLongAbsence && (
          <p className="text-xs text-[#636E72] mt-0.5">
            You were last here {formatTimeSince(hoursSince)} ago.
          </p>
        )}
      </div>

      {/* Claude recap */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3.5 w-full bg-[#A8C5B8]/30 rounded-full" />
          <div className="h-3.5 w-4/5 bg-[#A8C5B8]/30 rounded-full" />
        </div>
      ) : recap ? (
        <p className="text-sm text-[#2D3436] leading-relaxed">{recap}</p>
      ) : null}

      {/* Re-plan offer — only for 7+ day absence with remaining steps */}
      {isLongAbsence && remaining.length > 0 && !loading && (
        <div className="pt-1 border-t border-[#A8C5B8]/20">
          <p className="text-xs text-[#636E72] mb-2 leading-relaxed">
            Priorities sometimes shift. Want me to re-plan the remaining{" "}
            {remaining.length} step{remaining.length === 1 ? "" : "s"} in case
            things have changed?
          </p>
          <button
            type="button"
            onClick={handleReplan}
            disabled={replanning}
            className={cn(
              "text-xs font-medium text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded",
              "min-h-[36px] px-1",
              replanning && "opacity-60 cursor-not-allowed"
            )}
          >
            {replanning ? "Re-planning…" : "Re-plan the remaining steps"}
          </button>
        </div>
      )}
    </div>
  )
}
