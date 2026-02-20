"use client"

import { useRouter } from "next/navigation"
import { Task } from "@/types/task"
import { ProgressBar } from "@/components/feedback/ProgressBar"
import { getProgressPercentage, getCategoryColour, getCategoryLabel, cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
}

// Personal (#F0C674) is a light amber — needs dark text for contrast.
// All other category colours are dark enough for white text.
const LIGHT_CATEGORY_BADGE: Record<string, boolean> = {
  PERSONAL: true,
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PAUSED: {
    label: "Paused",
    className: "bg-[#F5F5F5] text-[#636E72] border border-[#DFE6E9]",
  },
  COMPLETED: {
    label: "✓ Done",
    className: "bg-[#EDF7F0] text-[#4A9E6B] border border-[#C8E6D0]",
  },
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter()
  const percentage = getProgressPercentage(task.subtasks)
  const completedCount = task.subtasks.filter((s) => s.completed).length
  const totalCount = task.subtasks.length
  const categoryColour = getCategoryColour(task.category)
  const categoryLabel = getCategoryLabel(task.category)
  const statusBadge = STATUS_BADGE[task.status]
  const isPaused = task.status === "PAUSED"
  // Light categories need dark text on their badge
  const badgeTextClass = LIGHT_CATEGORY_BADGE[task.category]
    ? "text-[#2D3436]"
    : "text-white"

  return (
    <article
      onClick={() => router.push(`/task/${task.id}`)}
      className={cn(
        "group bg-white border border-[#DFE6E9] rounded-xl p-6 cursor-pointer",
        "shadow-sm hover:shadow-md hover:border-[#B2BEC3] transition-all",
        // Paused tasks are visually muted but still fully interactive
        isPaused && "opacity-70"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}${isPaused ? " (paused)" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(`/task/${task.id}`)
        }
      }}
    >
      {/* Top row: category badge + status badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Category pill */}
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            badgeTextClass
          )}
          style={{ backgroundColor: categoryColour }}
        >
          {categoryLabel}
        </span>

        {/* Status badge — shown for PAUSED or COMPLETED only */}
        {statusBadge && (
          <span
            className={cn(
              "text-xs px-2.5 py-0.5 rounded-full font-medium",
              statusBadge.className
            )}
          >
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Task title */}
      <h3 className="font-medium text-[#2D3436] leading-snug mb-4 group-hover:text-[#1a1f20] transition-colors">
        {task.title}
      </h3>

      {/* Progress */}
      <div className="space-y-2">
        <ProgressBar progress={percentage} />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#636E72]">
            {totalCount === 0
              ? "No steps yet"
              : `${completedCount} of ${totalCount} step${totalCount === 1 ? "" : "s"} done`}
          </p>

          {/* Timeline shifted — subtle amber indicator, never red */}
          {task.targetDate &&
            new Date(task.targetDate) < new Date() &&
            task.status !== "COMPLETED" && (
              <span
                className="flex items-center gap-1 text-xs whitespace-nowrap flex-none"
                style={{ color: "#B8934A" }}
                aria-label="Timeline has shifted for this task"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4v3.5l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Timeline shifted
              </span>
            )}

          {/* Reminder indicator — shown if a reminder is set */}
          {task.reminderAt && (
            <span
              className="flex items-center gap-1 text-xs text-[#B2BEC3] whitespace-nowrap flex-none"
              aria-label={`Reminder set for ${new Date(task.reminderAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            >
              {/* Inline clock SVG — no icon library needed */}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M7 4.5V7l1.5 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {new Date(task.reminderAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
