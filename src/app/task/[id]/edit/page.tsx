"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { StreamingBreakdown } from "@/components/ai/StreamingBreakdown"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Task } from "@/types/task"
import { Category } from "@/types/task"

function EditPageContent({ taskId }: { taskId: string }) {
  const router = useRouter()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("PERSONAL")
  const [targetDate, setTargetDate] = useState("")

  // UI state
  const [titleError, setTitleError] = useState("")
  const [formError, setFormError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isBreakingDown, setIsBreakingDown] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [streamComplete, setStreamComplete] = useState(false)

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      if (res.status === 404) { setNotFound(true); return }
      const data = await res.json()
      if (!data.success) { setNotFound(true); return }
      const t: Task = data.data
      setTask(t)
      setTitle(t.title)
      setDescription(t.description ?? "")
      setCategory(t.category)
      setTargetDate(
        t.targetDate ? new Date(t.targetDate).toISOString().split("T")[0] : ""
      )
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { fetchTask() }, [fetchTask])

  function validate() {
    if (!title.trim()) {
      setTitleError("A title is required.")
      return false
    }
    setTitleError("")
    return true
  }

  async function saveTask(): Promise<boolean> {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        targetDate: targetDate || undefined,
      }),
    })
    return res.ok
  }

  async function handleSaveOnly(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    setFormError("")

    try {
      const ok = await saveTask()
      if (ok) {
        router.push(`/task/${taskId}`)
      } else {
        setFormError("Couldn't save right now. Try again in a moment.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveAndRebreak() {
    if (!validate()) return
    setFormError("")
    setIsSaving(true)

    try {
      const ok = await saveTask()
      if (!ok) {
        setFormError("Couldn't save right now. Try again in a moment.")
        return
      }

      setIsSaving(false)
      setIsBreakingDown(true)
      setStreamText("")
      setStreamComplete(false)

      const bdRes = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      if (!bdRes.body) throw new Error("No response stream available")

      const reader = bdRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

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
          } else if (event.type === "done") {
            setStreamComplete(true)
            await new Promise((r) => setTimeout(r, 500))
            router.push(`/task/${taskId}`)
            return
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Breakdown failed")
          }
        }
      }
    } catch {
      setIsBreakingDown(false)
      setIsSaving(false)
      setStreamText("")
      setStreamComplete(false)
      setFormError("Something didn't work — try again when you're ready.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-24 bg-[#DFE6E9] rounded" />
        <div className="h-6 w-48 bg-[#DFE6E9] rounded-lg" />
        <div className="h-12 bg-[#DFE6E9] rounded-xl" />
        <div className="h-24 bg-[#DFE6E9] rounded-xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 w-24 bg-[#DFE6E9] rounded-full" />)}
        </div>
      </div>
    )
  }

  if (notFound || !task) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-[#2D3436] font-medium">This task doesn&apos;t seem to exist.</p>
        <Link href="/dashboard" className="text-sm text-[#6B8F9E] hover:text-[#5A7D8C] transition-colors">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  if (isBreakingDown) {
    return <StreamingBreakdown streamText={streamText} isComplete={streamComplete} />
  }

  return (
    <div className="max-w-[560px] space-y-8">
      {/* Back */}
      <Link
        href={`/task/${taskId}`}
        className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
      >
        ← Back
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436] mb-1">
          Edit task
        </h1>
        <p className="text-sm text-[#636E72]">
          Make changes below. You can also generate a fresh breakdown.
        </p>
      </div>

      <form onSubmit={handleSaveOnly} className="space-y-6" noValidate>
        {/* Title */}
        <Input
          label="Task title"
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError("") }}
          maxLength={200}
          error={titleError}
          autoComplete="off"
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-description" className="text-sm font-medium text-[#2D3436]">
            Details{" "}
            <span className="font-normal text-[#636E72]">(optional)</span>
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            className={cn(
              "w-full px-4 py-3 rounded-xl text-[#2D3436] text-base",
              "bg-white border border-[#DFE6E9] placeholder:text-[#B2BEC3]",
              "transition-colors resize-none",
              "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]"
            )}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#2D3436]">Category</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select a category">
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
                  <span aria-hidden="true" className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Target date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-date" className="text-sm font-medium text-[#2D3436]">
            Target date{" "}
            <span className="font-normal text-[#636E72]">(optional)</span>
          </label>
          <input
            id="edit-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={cn(
              "w-full sm:w-auto px-4 py-3 rounded-xl text-[#2D3436] text-base",
              "bg-white border border-[#DFE6E9]",
              "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:border-[#6B8F9E]"
            )}
          />
        </div>

        {/* Error */}
        {formError && (
          <div role="alert" className="px-4 py-3 rounded-xl bg-[#E07070]/10 border border-[#E07070]/20 text-sm text-[#E07070]">
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" loading={isSaving} fullWidth>
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={isSaving}
            fullWidth
            onClick={handleSaveAndRebreak}
          >
            Re-break down
          </Button>
        </div>

        {/* Cancel */}
        <div className="text-center">
          <Link
            href={`/task/${taskId}`}
            className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
          >
            Cancel — go back without saving
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function EditTaskPage() {
  const params = useParams()
  const taskId = typeof params.id === "string" ? params.id : ""

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <EditPageContent taskId={taskId} />
        </main>
      </div>
    </AuthGuard>
  )
}
