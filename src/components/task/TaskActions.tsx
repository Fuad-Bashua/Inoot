"use client"

import { useState } from "react"
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
  const [pauseMessage, setPauseMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

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
      if (res.ok) {
        router.push("/dashboard")
      }
    } finally {
      setIsUpdating(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Pause message */}
      {pauseMessage && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-[#636E72] text-center py-2"
        >
          {pauseMessage}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Pause / Resume */}
        {task.status !== "COMPLETED" && (
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={isUpdating}
            className={cn(
              "px-4 py-2 text-sm rounded-xl border transition-colors touch-target",
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

        {/* Edit */}
        <button
          type="button"
          onClick={() => router.push(`/task/${task.id}/edit`)}
          className={cn(
            "px-4 py-2 text-sm rounded-xl border border-[#DFE6E9] text-[#636E72]",
            "hover:border-[#B2BEC3] transition-colors touch-target",
            "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2"
          )}
        >
          Edit task
        </button>

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className={cn(
              "px-4 py-2 text-sm rounded-xl border border-[#E07070]/30 text-[#E07070]/80",
              "hover:border-[#E07070]/60 hover:text-[#E07070] transition-colors touch-target",
              "focus-visible:outline-2 focus-visible:outline-[#E07070] focus-visible:outline-offset-2"
            )}
          >
            Delete task
          </button>
        ) : (
          /* Delete confirmation inline */
          <div className="w-full flex flex-col gap-2 mt-1 p-4 rounded-xl bg-[#E07070]/5 border border-[#E07070]/20">
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
                  "hover:bg-[#cf5f5f] transition-colors touch-target",
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
                  "hover:border-[#B2BEC3] transition-colors touch-target",
                  "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2"
                )}
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
