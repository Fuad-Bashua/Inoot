"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { CategoryFilter, FilterCategory } from "@/components/task/CategoryFilter"
import { TaskCard } from "@/components/task/TaskCard"
import { EmptyState } from "@/components/task/EmptyState"
import { Task } from "@/types/task"

function TaskGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3"
        >
          <div className="h-4 w-20 bg-[#DFE6E9] rounded-full animate-pulse" />
          <div className="h-5 w-3/4 bg-[#DFE6E9] rounded-lg animate-pulse" />
          <div className="h-2 w-full bg-[#DFE6E9] rounded-full animate-pulse" />
          <div className="h-3 w-24 bg-[#DFE6E9] rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("ALL")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  const fetchTasks = useCallback(async (category: FilterCategory) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category !== "ALL") params.set("category", category)
      const res = await fetch(`/api/tasks?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks(data.data ?? [])
    } catch {
      setError("Couldn't load your tasks right now. Give it a moment and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks(selectedCategory)
  }, [selectedCategory, fetchTasks])

  return (
    /*
     * pb-28 sm:pb-0 — extra bottom padding on mobile to clear the sticky
     * "New task" button that floats above the phone's home indicator.
     */
    <div className="flex flex-col gap-8 pb-28 sm:pb-0">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436]">
            Hey, {firstName}
          </h1>
          <p className="text-sm text-[#636E72] mt-1 leading-relaxed">
            Here&apos;s what you&apos;re working on.
          </p>
        </div>

        {/* Desktop-only inline CTA — hidden on mobile (sticky CTA used instead) */}
        <Link
          href="/task/new"
          className="hidden sm:flex items-center shrink-0 min-h-[44px] px-4 py-2.5
                     bg-[#6B8F9E] text-white rounded-xl text-sm font-medium
                     hover:bg-[#5A7D8C] transition-colors whitespace-nowrap"
        >
          + New task
        </Link>
      </div>

      {/* ── Category filter ─────────────────────────────────────────────── */}
      <CategoryFilter
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* ── Task list — aria-live announces changes to screen readers ───── */}
      <section aria-live="polite" aria-label="Your tasks">
        {loading ? (
          <TaskGridSkeleton />
        ) : error ? (
          <div className="py-12 text-center" role="alert">
            <p className="text-[#636E72] text-sm">{error}</p>
            <button
              onClick={() => fetchTasks(selectedCategory)}
              className="mt-4 min-h-[44px] px-4 text-sm text-[#6B8F9E]
                         hover:text-[#5A7D8C] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* ── Sticky bottom CTA — mobile only ─────────────────────────────── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40
                   bg-white border-t border-[#DFE6E9] px-4 pb-4 pt-3 safe-area-bottom"
      >
        <Link
          href="/task/new"
          className="flex items-center justify-center w-full min-h-[48px]
                     bg-[#6B8F9E] text-white rounded-xl text-base font-medium
                     hover:bg-[#5A7D8C] transition-colors"
        >
          + New task
        </Link>
      </div>
    </div>
  )
}
