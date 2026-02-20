import Link from "next/link"
import { FilterCategory } from "@/components/task/CategoryFilter"

interface EmptyStateProps {
  category?: FilterCategory
}

const MESSAGES: Record<FilterCategory, { heading: string; sub: string }> = {
  ALL: {
    heading: "Nothing here yet — and that's okay.",
    sub: "When you're ready, add your first task.",
  },
  ACADEMIC: {
    heading: "No academic tasks yet.",
    sub: "Whenever you have coursework, essays, or revision to tackle, this is where they'll live.",
  },
  CAREER: {
    heading: "No career tasks yet.",
    sub: "Job applications, portfolio work, networking — add them here when you're ready.",
  },
  PERSONAL: {
    heading: "No personal tasks yet.",
    sub: "Life admin, hobbies, goals — add them whenever you feel like it.",
  },
}

export function EmptyState({ category = "ALL" }: EmptyStateProps) {
  const { heading, sub } = MESSAGES[category]

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20 px-4">
      <span className="text-5xl mb-4" role="img" aria-label="Plant sprout">
        🌱
      </span>
      <h2 className="text-lg font-semibold text-[#2D3436] mb-2">{heading}</h2>
      <p className="text-sm text-[#636E72] leading-relaxed mb-6 max-w-xs">{sub}</p>
      <Link
        href="/task/new"
        className="inline-flex items-center px-5 py-2.5 bg-[#6B8F9E] text-white rounded-xl
                   text-sm font-medium hover:bg-[#5A7D8C] transition-colors
                   min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#6B8F9E]
                   focus-visible:outline-offset-2"
      >
        + Add a task
      </Link>
    </div>
  )
}
