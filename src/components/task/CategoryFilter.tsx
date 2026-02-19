"use client"

import { cn } from "@/lib/utils"

export type FilterCategory = "ALL" | "ACADEMIC" | "CAREER" | "PERSONAL"

interface Category {
  value: FilterCategory
  label: string
  icon?: string
  activeColour: string
}

const CATEGORIES: Category[] = [
  { value: "ALL",      label: "All",      activeColour: "#6B8F9E" },
  { value: "ACADEMIC", label: "Academic", icon: "📚", activeColour: "#7FAACC" },
  { value: "CAREER",   label: "Career",   icon: "💼", activeColour: "#C2A0D0" },
  { value: "PERSONAL", label: "Personal", icon: "🌱", activeColour: "#D4A843" },
]

interface CategoryFilterProps {
  selected: FilterCategory
  onChange: (category: FilterCategory) => void
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    /*
     * overflow-x-auto + scrollbar-hide: pills scroll horizontally on mobile
     * without showing a scrollbar — clean and accessible.
     * flex-nowrap prevents wrapping; the container itself constrains width.
     */
    <div
      className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0"
      role="tablist"
      aria-label="Filter tasks by category"
    >
      <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.value
          return (
            <button
              key={cat.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(cat.value)}
              className={cn(
                // 44px min-height for touch target
                "min-h-[44px] px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                isActive
                  ? "text-white"
                  : "bg-white border border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3]"
              )}
              style={isActive ? { backgroundColor: cat.activeColour } : undefined}
            >
              {cat.icon && <span aria-hidden="true" className="mr-1">{cat.icon}</span>}
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
