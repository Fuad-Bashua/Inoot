"use client"

import { useState } from "react"
import { Subtask } from "@/types/task"
import { formatTimeEstimate, cn } from "@/lib/utils"

interface NextActionStepProps {
  subtask: Subtask
  onComplete: (subtaskId: string) => void
}

export function NextActionStep({ subtask, onComplete }: NextActionStepProps) {
  const [completed, setCompleted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleComplete() {
    if (isUpdating || completed) return
    setIsUpdating(true)
    setCompleted(true)

    try {
      const res = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      if (res.ok) {
        onComplete(subtask.id)
      } else {
        setCompleted(false)
      }
    } catch {
      setCompleted(false)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      className="rounded-xl border border-[#A8C5B8]/30 bg-[#A8C5B8]/10 p-5 space-y-3"
      aria-label="Up next: your current step"
    >
      {/* Label */}
      <p className="text-xs font-medium text-[#636E72] uppercase tracking-wide">
        Up next
      </p>

      {/* Title */}
      <h3
        className={cn(
          "text-base font-medium text-[#2D3436] leading-snug transition-all duration-200",
          completed && "line-through text-[#B2BEC3]"
        )}
      >
        {subtask.title}
      </h3>

      {/* Description */}
      {subtask.description && (
        <p className="text-sm text-[#636E72] leading-relaxed">{subtask.description}</p>
      )}

      {/* Footer: time estimate + mark done */}
      <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
        {subtask.estimatedMinutes != null && (
          <span className="text-xs text-[#B2BEC3]">
            About {formatTimeEstimate(subtask.estimatedMinutes)}
          </span>
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={isUpdating || completed}
          aria-label={`Mark "${subtask.title}" as done`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors touch-target",
            "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
            completed
              ? "bg-[#81C995]/20 text-[#81C995] cursor-default"
              : "bg-[#6B8F9E] text-white hover:bg-[#5A7D8C]",
            isUpdating && "opacity-60 cursor-not-allowed"
          )}
        >
          {completed ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 8l4 4 6-6"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Done!
            </>
          ) : (
            "Mark as done"
          )}
        </button>
      </div>
    </div>
  )
}

/** Shown when all subtasks are completed */
export function AllDoneMessage() {
  return (
    <div className="rounded-xl border border-[#81C995]/30 bg-[#81C995]/10 px-5 py-6 text-center space-y-2">
      <p className="text-2xl" role="img" aria-label="Celebration">
        🎉
      </p>
      <p className="font-medium text-[#2D3436]">You&apos;ve completed every step.</p>
      <p className="text-sm text-[#636E72]">That&apos;s genuinely great work. You should feel good about this.</p>
    </div>
  )
}
