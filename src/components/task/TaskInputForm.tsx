"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { LoadingBreakdown } from "@/components/ai/LoadingBreakdown"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Category } from "@/types/task"

interface TaskInputFormProps {
  /** If provided, the form will pre-fill and PUT instead of POST */
  initialValues?: {
    id: string
    title: string
    description: string
    category: Category
    targetDate: string
  }
  mode?: "create" | "edit"
}

export function TaskInputForm({ initialValues, mode = "create" }: TaskInputFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [category, setCategory] = useState<Category>(initialValues?.category ?? "PERSONAL")
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ?? "")

  const [titleError, setTitleError] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBreakingDown, setIsBreakingDown] = useState(false)

  function validate() {
    if (!title.trim()) {
      setTitleError("A task title is needed so I can help break it down.")
      return false
    }
    setTitleError("")
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setError("")
    setIsLoading(true)

    try {
      let taskId: string

      if (mode === "edit" && initialValues?.id) {
        // Edit mode: PUT to update the task
        const res = await fetch(`/api/tasks/${initialValues.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            targetDate: targetDate || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to update task")
        taskId = data.data.id
      } else {
        // Create mode: POST to create a new task
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            targetDate: targetDate || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to create task")
        taskId = data.data.id
      }

      // Show loading breakdown UI before AI call
      setIsLoading(false)
      setIsBreakingDown(true)

      // Call AI breakdown
      const bdRes = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })
      const bdData = await bdRes.json()
      if (!bdRes.ok) throw new Error(bdData.error ?? "Failed to generate breakdown")

      // Success — navigate to the task view
      router.push(`/task/${taskId}`)
    } catch (err) {
      setIsBreakingDown(false)
      setIsLoading(false)
      setError(
        err instanceof Error
          ? err.message
          : "Something didn't work — try again when you're ready."
      )
    }
  }

  // Show the calm loading state while Claude is working
  if (isBreakingDown) {
    return <LoadingBreakdown />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Title */}
      <Input
        label="What do you need to get done?"
        id="task-title"
        name="title"
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          if (titleError) setTitleError("")
        }}
        placeholder="e.g. Write my essay introduction"
        maxLength={200}
        error={titleError}
        autoComplete="off"
        autoFocus
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="task-description"
          className="text-sm font-medium text-[#2D3436]"
        >
          Any details or context?{" "}
          <span className="font-normal text-[#636E72]">(optional)</span>
        </label>
        <textarea
          id="task-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any details or context that might help..."
          maxLength={2000}
          rows={4}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-[#2D3436] text-base",
            "bg-white border border-[#DFE6E9] placeholder:text-[#B2BEC3]",
            "transition-colors resize-none",
            "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]",
            "sm:rows-3"
          )}
        />
        {description.length > 1800 && (
          <p className="text-xs text-[#B2BEC3] text-right">
            {2000 - description.length} characters remaining
          </p>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[#2D3436]">Category</span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Select a category"
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value as Category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors touch-target",
                  "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                  isActive
                    ? "text-white"
                    : "bg-white border border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3]"
                )}
                style={isActive ? { backgroundColor: cat.colour } : undefined}
                aria-pressed={isActive}
              >
                <span aria-hidden="true" className="mr-1">
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Target date (optional) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="task-date"
          className="text-sm font-medium text-[#2D3436]"
        >
          Target date{" "}
          <span className="font-normal text-[#636E72]">(optional)</span>
        </label>
        <input
          id="task-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className={cn(
            "w-full sm:w-auto px-4 py-3 rounded-xl text-[#2D3436] text-base",
            "bg-white border border-[#DFE6E9]",
            "transition-colors",
            "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]"
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-[#E07070]/10 border border-[#E07070]/20 text-sm text-[#E07070]"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        loading={isLoading}
        fullWidth
        className="text-base py-3"
      >
        {mode === "edit" ? "Save and re-break down" : "Break it down for me"}
      </Button>
    </form>
  )
}
