"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// Dismiss key pattern: "inoot_deadline_dismissed_{taskId}"
// Value: ISO string of when it was dismissed.
// Don't re-show for 3 days after dismissal without setting a new date.
const DISMISS_KEY = (taskId: string) => `inoot_deadline_dismissed_${taskId}`
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function shouldShowDeadlineCard(taskId: string, targetDate: string | null): boolean {
  if (!targetDate) return false
  // Target date must be in the past
  if (new Date(targetDate) >= new Date()) return false

  // Check if dismissed within the last 3 days
  try {
    const raw = localStorage.getItem(DISMISS_KEY(taskId))
    if (raw) {
      const dismissedAt = new Date(raw).getTime()
      if (Date.now() - dismissedAt < THREE_DAYS_MS) return false
    }
  } catch {
    /* localStorage not available (SSR) */
  }

  return true
}

interface MissedDeadlineCardProps {
  taskId: string
  targetDate: string
  onSetNewDate: (date: string) => Promise<void>
}

export function MissedDeadlineCard({
  taskId,
  targetDate,
  onSetNewDate,
}: MissedDeadlineCardProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const formattedPastDate = new Date(targetDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  })

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY(taskId), new Date().toISOString())
    } catch {
      /* silently ignore */
    }
    setDismissed(true)
  }

  async function handleSetDate() {
    if (!newDate) return
    setSaving(true)
    try {
      await onSetNewDate(newDate)
      setDismissed(true)
    } catch {
      /* let parent handle errors */
    } finally {
      setSaving(false)
    }
  }

  if (dismissed) return null

  return (
    <div
      className="rounded-xl border border-[#F0C674]/40 bg-[#F0C674]/8 px-5 py-4 space-y-3"
      role="note"
      aria-label="Timeline note"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-[#B8934A] uppercase tracking-wide">
            Timeline shifted
          </p>
          <p className="text-sm text-[#2D3436] leading-relaxed">
            Looks like the timeline for this task has shifted — the{" "}
            {formattedPastDate} date has passed, and that happens. Want to set a
            new target date?
          </p>
        </div>
        {/* Dismiss without setting a new date */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss timeline note"
          className={cn(
            "flex-none p-1.5 text-[#B2BEC3] hover:text-[#636E72] transition-colors rounded",
            "min-h-[36px] min-w-[36px] flex items-center justify-center",
            "focus-visible:outline-2 focus-visible:outline-[#6B8F9E]"
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Date picker or prompt */}
      {!showPicker ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg",
              "border border-[#F0C674]/60 text-[#B8934A] bg-white",
              "hover:bg-[#F0C674]/10 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] min-h-[36px]"
            )}
          >
            Set a new date
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-[#B2BEC3] hover:text-[#636E72] transition-colors
                       focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded min-h-[36px] px-1"
          >
            No thanks
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            aria-label="New target date"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm text-[#2D3436] bg-white",
              "border border-[#DFE6E9]",
              "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]",
              "min-h-[36px]"
            )}
          />
          <button
            type="button"
            onClick={handleSetDate}
            disabled={!newDate || saving}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg min-h-[36px]",
              "bg-[#6B8F9E] text-white hover:bg-[#5A7D8C] transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E]"
            )}
          >
            {saving ? "Saving…" : "Update date"}
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="text-xs text-[#B2BEC3] hover:text-[#636E72] transition-colors
                       focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded min-h-[36px] px-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
