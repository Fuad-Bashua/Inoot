"use client"

import { useState } from "react"
import { Subtask } from "@/types/task"
import { formatTimeEstimate, cn } from "@/lib/utils"

interface SubtaskItemProps {
  subtask: Subtask
  /** Whether this is the highlighted "up next" item (rendered by NextActionStep instead) */
  isNext?: boolean
  onToggle?: (subtaskId: string, completed: boolean) => void
}

export function SubtaskItem({ subtask, isNext = false, onToggle }: SubtaskItemProps) {
  const [completed, setCompleted] = useState(subtask.completed)
  const [isUpdating, setIsUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleToggle() {
    if (isUpdating) return
    setIsUpdating(true)
    const newValue = !completed

    // Optimistically update
    setCompleted(newValue)

    try {
      const res = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newValue }),
      })
      if (!res.ok) {
        // Revert on failure
        setCompleted(!newValue)
      } else {
        onToggle?.(subtask.id, newValue)
      }
    } catch {
      setCompleted(!newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <li
      className={cn(
        "flex gap-3 py-4 border-b border-[#DFE6E9] last:border-b-0 transition-opacity duration-200",
        completed && !isNext && "opacity-50"
      )}
    >
      {/* Checkbox — 44px touch target wrapper */}
      <div className="flex-none flex items-start pt-0.5">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isUpdating}
          aria-label={`Mark "${subtask.title}" as ${completed ? "incomplete" : "complete"}`}
          aria-pressed={completed}
          className={cn(
            "touch-target flex items-center justify-center rounded-md",
            "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
            isUpdating && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 flex-none",
              completed
                ? "bg-[#6B8F9E] border-[#6B8F9E]"
                : "bg-white border-[#B2BEC3] hover:border-[#6B8F9E]"
            )}
          >
            {completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
          <span
            className={cn(
              "text-sm font-medium text-[#2D3436] leading-snug transition-all duration-200",
              completed && "line-through text-[#B2BEC3]"
            )}
          >
            {subtask.title}
          </span>
          {subtask.estimatedMinutes != null && (
            <span className="text-xs text-[#B2BEC3] whitespace-nowrap flex-none">
              {formatTimeEstimate(subtask.estimatedMinutes)}
            </span>
          )}
        </div>

        {/* Description — expandable */}
        {subtask.description && (
          <div className="mt-1">
            {expanded ? (
              <p className="text-sm text-[#636E72] leading-relaxed">{subtask.description}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors mt-1 focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
              aria-expanded={expanded}
            >
              {expanded ? "Hide details" : "Show details"}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
