"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Task } from "@/types/task"
import { cn } from "@/lib/utils"

interface TaskActionsProps {
  task: Task
  onStatusChange?: (newStatus: Task["status"]) => void
}

export function TaskActions({ task, onStatusChange }: TaskActionsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [pauseMessage, setPauseMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close ••• dropdown when clicking outside
  useEffect(() => {
    if (!showMore) return
    function handleOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [showMore])

  // Close on Escape key
  useEffect(() => {
    if (!showMore) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowMore(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [showMore])

  async function handleTogglePause() {
    setIsUpdating(true)
    const newStatus = task.status === "PAUSED" ? "ACTIVE" : "PAUSED"
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        onStatusChange?.(newStatus)
        if (newStatus === "PAUSED") {
          setPauseMessage("No worries — we'll pick this up when you're ready.")
          setTimeout(() => setPauseMessage(""), 4000)
        } else {
          setPauseMessage("Welcome back. Let's keep going.")
          setTimeout(() => setPauseMessage(""), 3000)
        }
      }
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (res.ok) router.push("/dashboard")
    } finally {
      setIsUpdating(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Pause / resume message */}
      {pauseMessage && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-[#636E72] text-center py-2"
        >
          {pauseMessage}
        </p>
      )}

      {/* ── Three visible actions: Pause · Edit · ••• ──────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* 1 — Pause / Resume (only for non-completed tasks) */}
        {task.status !== "COMPLETED" && (
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={isUpdating}
            className={cn(
              "px-4 py-2 text-sm rounded-xl border transition-colors min-h-[44px]",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
              task.status === "PAUSED"
                ? "border-[#6B8F9E] text-[#6B8F9E] hover:bg-[#6B8F9E]/10"
                : "border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3]",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {task.status === "PAUSED" ? "Resume task" : "Pause task"}
          </button>
        )}

        {/* 2 — Edit */}
        <button
          type="button"
          onClick={() => router.push(`/task/${task.id}/edit`)}
          className={cn(
            "px-4 py-2 text-sm rounded-xl border border-[#DFE6E9] text-[#636E72]",
            "hover:border-[#B2BEC3] transition-colors min-h-[44px]",
            "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2"
          )}
        >
          Edit task
        </button>

        {/* 3 — ••• More (holds Delete) */}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-label="More options"
            aria-expanded={showMore}
            aria-haspopup="menu"
            className={cn(
              "px-3 py-2 text-base leading-none rounded-xl border text-[#636E72]",
              "hover:border-[#B2BEC3] transition-colors min-h-[44px] min-w-[44px]",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
              showMore
                ? "border-[#B2BEC3] bg-[#F8F9FA]"
                : "border-[#DFE6E9] bg-white"
            )}
          >
            •••
          </button>

          {/* Dropdown — opens upward so it doesn't clip off screen */}
          {showMore && (
            <div
              role="menu"
              aria-label="More task options"
              className={cn(
                "absolute bottom-full left-0 mb-2 z-50",
                "min-w-[160px] bg-white rounded-xl",
                "border border-[#DFE6E9] shadow-lg py-1",
                "animate-[fadeIn_0.12s_ease-out]"
              )}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowMore(false)
                  setShowDeleteConfirm(true)
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm",
                  "text-[#E07070]/80 hover:bg-[#E07070]/5 hover:text-[#E07070]",
                  "transition-colors focus-visible:outline-none focus-visible:bg-[#E07070]/5"
                )}
              >
                Delete task…
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation — expands inline below the action row */}
      {showDeleteConfirm && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#E07070]/5 border border-[#E07070]/20">
          <p className="text-sm text-[#636E72]">
            Are you sure? This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUpdating}
              className={cn(
                "px-4 py-2 text-sm rounded-xl bg-[#E07070] text-white",
                "hover:bg-[#cf5f5f] transition-colors min-h-[44px]",
                "focus-visible:outline-2 focus-visible:outline-[#E07070] focus-visible:outline-offset-2",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
            >
              Yes, delete it
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className={cn(
                "px-4 py-2 text-sm rounded-xl border border-[#DFE6E9] text-[#636E72]",
                "hover:border-[#B2BEC3] transition-colors min-h-[44px]",
                "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2"
              )}
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
