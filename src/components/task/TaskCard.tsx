"use client"

import { useRouter } from "next/navigation"
import { Task } from "@/types/task"
import { ProgressBar } from "@/components/feedback/ProgressBar"
import { getProgressPercentage, getCategoryColour, getCategoryLabel } from "@/lib/utils"

interface TaskCardProps {
  task: Task
}

const statusBadge: Record<string, { label: string; className: string }> = {
  PAUSED: {
    label: "Paused",
    className: "bg-[#F0F0F0] text-[#636E72] border border-[#DFE6E9]",
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
  const badge = statusBadge[task.status]

  return (
    <article
      onClick={() => router.push(`/task/${task.id}`)}
      className="group bg-white border border-[#DFE6E9] rounded-xl p-6 cursor-pointer
                 shadow-sm hover:shadow-md hover:border-[#B2BEC3] transition-all"
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
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
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: categoryColour }}
        >
          {categoryLabel}
        </span>

        {/* Status badge — only shown for PAUSED or COMPLETED */}
        {badge && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Task title */}
      <h3 className="font-medium text-[#2D3436] leading-snug mb-4 group-hover:text-[#1a1f20] transition-colors">
        {task.title}
      </h3>

      {/* Progress section */}
      <div className="space-y-2">
        <ProgressBar progress={percentage} />
        <p className="text-xs text-[#636E72]">
          {totalCount === 0
            ? "No steps yet"
            : `${completedCount} of ${totalCount} step${totalCount === 1 ? "" : "s"} done`}
        </p>
      </div>
    </article>
  )
}
