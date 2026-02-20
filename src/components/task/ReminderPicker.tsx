"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ReminderPickerProps {
  taskId: string
  reminderAt: string | null
  onUpdate: (newReminderAt: string | null) => void
}

/** Clock icon — inline SVG so no icon-library dependency needed */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5v3.5l2 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Compute a Date for each preset option */
function getPresetDate(key: string): Date {
  const now = new Date()
  switch (key) {
    case "later-today": {
      // If before 4pm → set to 6pm; if after 4pm → add 3 hours
      const d = new Date()
      d.setHours(now.getHours() >= 16 ? now.getHours() + 3 : 18, 0, 0, 0)
      return d
    }
    case "tomorrow": {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      return d
    }
    case "3-days": {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      d.setHours(9, 0, 0, 0)
      return d
    }
    case "next-week": {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      d.setHours(9, 0, 0, 0)
      return d
    }
    default:
      return now
  }
}

const PRESETS = [
  { key: "later-today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "3-days", label: "In 3 days" },
  { key: "next-week", label: "Next week" },
]

function formatReminder(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function ReminderPicker({ taskId, reminderAt, onUpdate }: ReminderPickerProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customDate, setCustomDate] = useState("")

  async function saveReminder(isoString: string | null) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderAt: isoString }),
      })
      if (res.ok) {
        onUpdate(isoString)
        setOpen(false)
        setCustomDate("")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handlePreset(key: string) {
    const date = getPresetDate(key)
    await saveReminder(date.toISOString())
  }

  async function handleCustomDate() {
    if (!customDate) return
    const date = new Date(customDate)
    date.setHours(9, 0, 0, 0)
    await saveReminder(date.toISOString())
  }

  async function handleClear() {
    await saveReminder(null)
  }

  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-2">
      {/* Current reminder display + controls */}
      {reminderAt ? (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 text-sm text-[#636E72]">
            <ClockIcon className="w-3.5 h-3.5 flex-none" />
            Reminder: {formatReminder(reminderAt)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="text-xs text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
            >
              Change
            </button>
            <span className="text-[#DFE6E9]" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="text-xs text-[#B2BEC3] hover:text-[#636E72] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-sm text-[#B2BEC3] hover:text-[#636E72] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded touch-target"
        >
          <ClockIcon className="w-3.5 h-3.5 flex-none" />
          Set a reminder
        </button>
      )}

      {/* Picker panel */}
      {open && (
        <div
          className="p-4 bg-white border border-[#DFE6E9] rounded-xl shadow-sm space-y-4"
          role="group"
          aria-label="Choose reminder time"
        >
          <p className="text-xs font-medium text-[#636E72] uppercase tracking-wide">
            Remind me
          </p>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePreset(p.key)}
                disabled={saving}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border border-[#DFE6E9] text-[#636E72]",
                  "hover:border-[#6B8F9E] hover:text-[#6B8F9E] transition-colors min-h-[36px]",
                  "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date input */}
          <div className="flex gap-2 items-center">
            <label htmlFor="reminder-custom-date" className="sr-only">
              Custom reminder date
            </label>
            <input
              id="reminder-custom-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={todayStr}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#DFE6E9] text-[#2D3436]
                         focus:outline-none focus:ring-2 focus:ring-[#6B8F9E] bg-white"
            />
            <button
              type="button"
              onClick={handleCustomDate}
              disabled={!customDate || saving}
              className={cn(
                "px-3 py-2 text-sm rounded-lg bg-[#6B8F9E] text-white transition-colors min-h-[38px]",
                "hover:bg-[#5A7D8C] focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                (!customDate || saving) && "opacity-50 cursor-not-allowed"
              )}
            >
              Set
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setOpen(false); setCustomDate("") }}
            className="text-xs text-[#B2BEC3] hover:text-[#636E72] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
