"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { StreamingBreakdown } from "@/components/ai/StreamingBreakdown"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Category } from "@/types/task"
import { getStoredEnergyMode } from "@/components/dashboard/EnergySelector"

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
  // Streaming state
  const [streamText, setStreamText] = useState("")
  const [streamComplete, setStreamComplete] = useState(false)
  // Progressive disclosure: auto-expand if editing and existing data is present
  const [showDetails, setShowDetails] = useState(
    !!(initialValues?.description || initialValues?.targetDate)
  )

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

      // Switch to streaming breakdown UI
      setIsLoading(false)
      setIsBreakingDown(true)
      setStreamText("")
      setStreamComplete(false)

      // ── Streaming fetch ────────────────────────────────────────────────────
      const bdRes = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, energyMode: getStoredEnergyMode() }),
      })

      if (!bdRes.body) throw new Error("No response stream available")

      const reader = bdRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: { type: string; text?: string; taskId?: string; message?: string }
          try { event = JSON.parse(raw) } catch { continue }

          if (event.type === "chunk" && event.text) {
            setStreamText((prev) => prev + event.text)
          } else if (event.type === "done" && event.taskId) {
            setStreamComplete(true)
            // Brief pause so the "saving" state is visible, then navigate
            await new Promise((r) => setTimeout(r, 500))
            router.push(`/task/${event.taskId}`)
            return
          } else if (event.type === "error") {
            throw new Error(
              event.message ?? "Something didn't work — try again when you're ready."
            )
          }
        }
      }
    } catch (err) {
      setIsBreakingDown(false)
      setIsLoading(false)
      setStreamText("")
      setStreamComplete(false)
      setError(
        err instanceof Error
          ? err.message
          : "Something didn't work — try again when you're ready."
      )
    }
  }

  // Show streaming breakdown UI while Claude is generating
  if (isBreakingDown) {
    return <StreamingBreakdown streamText={streamText} isComplete={streamComplete} />
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

      {/* ── "Add more details" progressive disclosure ───────────────── */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className={cn(
            "flex items-center gap-1.5 text-sm text-[#636E72] hover:text-[#2D3436]",
            "transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] rounded"
          )}
        >
          <svg
            className={cn("w-3.5 h-3.5 transition-transform", showDetails && "rotate-90")}
            fill="none"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showDetails ? "Hide details" : "Add more details"}
        </button>

        {showDetails && (
          <div className="space-y-4">
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-description" className="text-sm font-medium text-[#2D3436]">
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
                  "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]"
                )}
              />
              {description.length > 1800 && (
                <p className="text-xs text-[#B2BEC3] text-right">
                  {2000 - description.length} characters remaining
                </p>
              )}
            </div>

            {/* Target date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-date" className="text-sm font-medium text-[#2D3436]">
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
          </div>
        )}
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
