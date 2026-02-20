"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { formatDate, cn } from "@/lib/utils"
import { UserPatterns } from "@/lib/patterns"

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
}

type ReminderFrequency = "gentle" | "moderate" | "off"
type TonePref = "SUPPORTIVE" | "STRUCTURED" | "CASUAL"
type DetailLevel = "detailed" | "brief"
type FontSize = "default" | "large" | "xl"

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-[#2D3436]">{title}</h2>
      {children}
    </section>
  )
}

// ─── Saved badge ──────────────────────────────────────────────────────────────

function SavedBadge({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <span role="status" aria-live="polite" className="text-xs text-[#81C995]">
      {message}
    </span>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onToggle,
  disabled,
  label,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
        checked ? "bg-[#6B8F9E]" : "bg-[#DFE6E9]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
        aria-hidden="true"
      />
    </button>
  )
}

// ─── 1. AI Tone ───────────────────────────────────────────────────────────────

const TONE_OPTIONS: { value: TonePref; label: string; preview: string }[] = [
  {
    value: "SUPPORTIVE",
    label: "Supportive",
    preview:
      "When you're ready, a good place to start might be to gather your notes. Take your time — there's no rush at all.",
  },
  {
    value: "STRUCTURED",
    label: "Structured",
    preview:
      "Step 1: Gather notes. Step 2: Create an outline. Each step has a clear, specific output.",
  },
  {
    value: "CASUAL",
    label: "Casual",
    preview:
      "Let's start by getting your notes together — that's the easy first bit! You've totally got this.",
  },
]

function AIToneCard() {
  const [current, setCurrent] = useState<TonePref>("SUPPORTIVE")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.tonePreference) setCurrent(d.data.tonePreference) })
      .catch(() => {})
  }, [])

  async function handleSelect(value: TonePref) {
    if (value === current || saving) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tonePreference: value }),
      })
      if (res.ok) {
        setCurrent(value)
        setMsg("Saved.")
        setTimeout(() => setMsg(null), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🗣️</span>
          <span className="text-sm font-medium text-[#2D3436]">How Inoot speaks to you</span>
        </div>
        <SavedBadge message={msg} />
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="AI tone preference">
        {TONE_OPTIONS.map((opt) => {
          const isSelected = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl border transition-colors",
                "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                isSelected
                  ? "border-[#6B8F9E] bg-[#6B8F9E]/5"
                  : "border-[#DFE6E9] hover:border-[#B2BEC3]",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              <p className={cn("text-sm font-medium", isSelected ? "text-[#6B8F9E]" : "text-[#2D3436]")}>
                {opt.label}
                {opt.value === "SUPPORTIVE" && (
                  <span className="ml-2 text-xs text-[#B2BEC3] font-normal">default</span>
                )}
              </p>
              {/* Preview — always visible so users know what they're choosing */}
              <p className="text-xs text-[#636E72] mt-1.5 leading-relaxed italic">
                &ldquo;{opt.preview}&rdquo;
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 2. Task Detail Level ─────────────────────────────────────────────────────

const DETAIL_OPTIONS: { value: DetailLevel; label: string; description: string; preview: string }[] = [
  {
    value: "detailed",
    label: "Detailed",
    description: "Longer descriptions and more guidance — helps when you need context.",
    preview: "Open your notes app and create a new document. Write the date at the top so you know when you started.",
  },
  {
    value: "brief",
    label: "Brief",
    description: "Short, to-the-point steps — good when you know what you're doing.",
    preview: "Create a new document and add the date.",
  },
]

function TaskDetailLevelCard() {
  const [current, setCurrent] = useState<DetailLevel>("detailed")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.taskDetailLevel) setCurrent(d.data.taskDetailLevel) })
      .catch(() => {})
  }, [])

  async function handleSelect(value: DetailLevel) {
    if (value === current || saving) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskDetailLevel: value }),
      })
      if (res.ok) {
        setCurrent(value)
        setMsg("Saved.")
        setTimeout(() => setMsg(null), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📝</span>
          <span className="text-sm font-medium text-[#2D3436]">Step detail level</span>
        </div>
        <SavedBadge message={msg} />
      </div>
      <p className="text-xs text-[#636E72] leading-relaxed">
        Controls how much detail Inoot adds to each step when breaking down a task.
      </p>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Task detail level">
        {DETAIL_OPTIONS.map((opt) => {
          const isSelected = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={cn(
                "text-left px-4 py-3.5 rounded-xl border transition-colors space-y-2",
                "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                isSelected
                  ? "border-[#6B8F9E] bg-[#6B8F9E]/5"
                  : "border-[#DFE6E9] hover:border-[#B2BEC3]",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              <p className={cn("text-sm font-medium", isSelected ? "text-[#6B8F9E]" : "text-[#2D3436]")}>
                {opt.label}
              </p>
              <p className="text-xs text-[#636E72] leading-relaxed">{opt.description}</p>
              <p className="text-xs text-[#B2BEC3] italic leading-relaxed">&ldquo;{opt.preview}&rdquo;</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 3. Reminders ────────────────────────────────────────────────────────────

const REMINDER_OPTIONS: { value: ReminderFrequency; label: string; description: string }[] = [
  { value: "gentle",   label: "Gentle",   description: "Remind me once, quietly." },
  { value: "moderate", label: "Moderate", description: "Remind me twice, a day apart." },
  { value: "off",      label: "Off",      description: "No reminders for now." },
]

function ReminderPreference() {
  const [current, setCurrent] = useState<ReminderFrequency>("gentle")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.reminderFrequency) setCurrent(d.data.reminderFrequency) })
      .catch(() => {})
  }, [])

  async function handleSelect(value: ReminderFrequency) {
    if (value === current || saving) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderFrequency: value }),
      })
      if (res.ok) {
        setCurrent(value)
        setMsg("Saved.")
        setTimeout(() => setMsg(null), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔔</span>
          <span className="text-sm font-medium text-[#2D3436]">Reminders</span>
        </div>
        <SavedBadge message={msg} />
      </div>
      <p className="text-xs text-[#636E72] leading-relaxed">
        How often Inoot reminds you about tasks you&apos;ve flagged. You can change this any time.
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reminder frequency">
        {REMINDER_OPTIONS.map((opt) => {
          const isSelected = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={cn(
                "flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors min-h-[44px]",
                "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                isSelected
                  ? "border-[#6B8F9E] bg-[#6B8F9E]/5 text-[#2D3436]"
                  : "border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3]",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn("text-sm font-medium", isSelected && "text-[#6B8F9E]")}>{opt.label}</span>
              <span className="text-xs mt-0.5 opacity-80">{opt.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 4. Accessibility ─────────────────────────────────────────────────────────

function AccessibilityCard() {
  const [fontSize, setFontSize] = useState<FontSize>("default")
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return
        setFontSize((d.data.fontSizePreference as FontSize) || "default")
        setReducedMotion(Boolean(d.data.reducedMotion))
        setHighContrast(Boolean(d.data.highContrast))
      })
      .catch(() => {})
  }, [])

  async function save(patch: Record<string, unknown>) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        setMsg("Saved.")
        setTimeout(() => setMsg(null), 2500)
        // Apply to DOM immediately
        const root = document.documentElement
        if ("fontSizePreference" in patch) {
          const v = patch.fontSizePreference as string
          const fontSizeMap: Record<string, string> = { large: "112.5%", xl: "125%" }
          root.style.fontSize = fontSizeMap[v] ?? ""
        }
        if ("reducedMotion" in patch) {
          patch.reducedMotion ? root.setAttribute("data-reduced-motion", "true") : root.removeAttribute("data-reduced-motion")
        }
        if ("highContrast" in patch) {
          patch.highContrast ? root.setAttribute("data-high-contrast", "true") : root.removeAttribute("data-high-contrast")
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const fontOptions: { value: FontSize; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "large",   label: "Large" },
    { value: "xl",      label: "Extra large" },
  ]

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">♿</span>
          <span className="text-sm font-medium text-[#2D3436]">Accessibility</span>
        </div>
        <SavedBadge message={msg} />
      </div>

      {/* Font size */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#636E72]">Text size</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Text size">
          {fontOptions.map((opt) => {
            const isSelected = fontSize === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={saving}
                onClick={() => {
                  setFontSize(opt.value)
                  save({ fontSizePreference: opt.value })
                }}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl border transition-colors min-h-[44px]",
                  "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                  isSelected
                    ? "border-[#6B8F9E] bg-[#6B8F9E]/5 text-[#6B8F9E] font-medium"
                    : "border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3]",
                  saving && "opacity-60 cursor-not-allowed"
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#DFE6E9]" />

      {/* Reduced motion */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#2D3436]">Reduce motion</p>
          <p className="text-xs text-[#636E72] mt-0.5 leading-relaxed">
            Disables animations and transitions. Mirrors your OS setting but lets you override it here.
          </p>
        </div>
        <ToggleSwitch
          checked={reducedMotion}
          onToggle={() => {
            const next = !reducedMotion
            setReducedMotion(next)
            save({ reducedMotion: next })
          }}
          disabled={saving}
          label={`Reduce motion: ${reducedMotion ? "on" : "off"}`}
        />
      </div>

      {/* High contrast */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#2D3436]">Higher contrast</p>
          <p className="text-xs text-[#636E72] mt-0.5 leading-relaxed">
            Increases text and border contrast across the app.
          </p>
        </div>
        <ToggleSwitch
          checked={highContrast}
          onToggle={() => {
            const next = !highContrast
            setHighContrast(next)
            save({ highContrast: next })
          }}
          disabled={saving}
          label={`Higher contrast: ${highContrast ? "on" : "off"}`}
        />
      </div>
    </div>
  )
}

// ─── 5. Encouragement & Reassurance ──────────────────────────────────────────

function EncouragementSection() {
  const [showProgress, setShowProgress] = useState(true)
  const [showOptional, setShowOptional] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)
  const [savingOptional, setSavingOptional] = useState(false)
  const [msgProgress, setMsgProgress] = useState<string | null>(null)
  const [msgOptional, setMsgOptional] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setShowProgress(d.data.showEncouragement !== false)
          setShowOptional(Boolean(d.data.showOptionalEncouragement))
        }
      })
      .catch(() => {})
  }, [])

  async function saveField(
    field: string,
    value: boolean,
    setState: (v: boolean) => void,
    setSaving: (v: boolean) => void,
    setMsg: (m: string | null) => void
  ) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        setState(value)
        setMsg("Saved.")
        setTimeout(() => setMsg(null), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🌱</span>
        <span className="text-sm font-medium text-[#2D3436]">Encouragement</span>
      </div>

      {/* Progress messages */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-none" aria-hidden="true">📊</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#2D3436]">Progress messages</p>
            <p className="text-xs text-[#636E72] mt-0.5 leading-relaxed">
              Brief milestone notes as you complete steps — e.g. &quot;Halfway done.&quot;
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <SavedBadge message={msgProgress} />
          <ToggleSwitch
            checked={showProgress}
            onToggle={() =>
              saveField(
                "showEncouragement",
                !showProgress,
                setShowProgress,
                setSavingProgress,
                setMsgProgress
              )
            }
            disabled={savingProgress}
            label={`Progress messages: ${showProgress ? "on" : "off"}`}
          />
        </div>
      </div>

      <div className="border-t border-[#F0F0F0]" />

      {/* Occasional encouraging messages */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-none" aria-hidden="true">💬</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#2D3436]">Occasional encouraging messages</p>
            <p className="text-xs text-[#636E72] mt-0.5 leading-relaxed">
              Rotating greetings and gentle idle nudges. Off by default — some people prefer a quieter experience.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <SavedBadge message={msgOptional} />
          <ToggleSwitch
            checked={showOptional}
            onToggle={() =>
              saveField(
                "showOptionalEncouragement",
                !showOptional,
                setShowOptional,
                setSavingOptional,
                setMsgOptional
              )
            }
            disabled={savingOptional}
            label={`Occasional encouraging messages: ${showOptional ? "on" : "off"}`}
          />
        </div>
      </div>
    </div>
  )
}

// ─── 6. What Inoot has noticed ────────────────────────────────────────────────

function PatternRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F0F0F0] last:border-b-0">
      <span className="text-base flex-none mt-0.5" aria-hidden="true">{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#636E72]">{label}</p>
        <p className="text-sm text-[#2D3436] mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  )
}

function LearnedPatterns() {
  const [patterns, setPatterns] = useState<UserPatterns | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/patterns")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPatterns(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-[#DFE6E9] rounded-full w-3/4" />)}
      </div>
    )
  }

  if (!patterns || patterns.taskCount < 3) {
    return (
      <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🌱</span>
          <span className="text-sm font-medium text-[#2D3436]">Just getting started</span>
        </div>
        <p className="text-xs text-[#636E72] leading-relaxed">
          Inoot learns from your patterns over time. Once you&apos;ve created a few more tasks,
          personalised insights will appear here.
        </p>
        <p className="text-xs text-[#B2BEC3]">{patterns?.taskCount ?? 0} of 3 tasks needed.</p>
      </div>
    )
  }

  const timeLabels: Record<string, string> = {
    morning: "in the morning", afternoon: "in the afternoon",
    evening: "in the evening", night: "late at night",
  }
  const catLabels: Record<string, string> = {
    ACADEMIC: "Academic", CAREER: "Career", PERSONAL: "Personal",
  }
  const completionPct = Math.round(patterns.avgCompletionRate * 100)
  const complexityLabels: Record<string, string> = {
    simple: "Simple and focused — you tend to prefer shorter task lists.",
    moderate: "Balanced — somewhere between focused and detailed.",
    complex: "Detailed — you're comfortable with multi-step plans.",
  }
  const pauseLabels: Record<string, string> = {
    low: "Rarely — you tend to see tasks through to the end.",
    moderate: "Occasionally — which is completely normal.",
    high: "Often — Inoot will be extra gentle when breaking things down.",
  }

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" aria-hidden="true">🔍</span>
        <span className="text-sm font-medium text-[#2D3436]">
          Based on your last {patterns.taskCount} task{patterns.taskCount === 1 ? "" : "s"}
        </span>
      </div>
      {patterns.mostActiveTimeOfDay && (
        <PatternRow emoji="🕐" label="Active time"
          value={`You tend to work ${timeLabels[patterns.mostActiveTimeOfDay]}.`} />
      )}
      {patterns.dominantCategory && (
        <PatternRow emoji="📂" label="Most common category"
          value={`${catLabels[patterns.dominantCategory]} tasks make up most of your work.`} />
      )}
      {completionPct > 0 && (
        <PatternRow emoji="✅" label="Step completion"
          value={`You complete around ${completionPct}% of steps per session — ${
            completionPct > 75 ? "a strong follow-through rate."
            : completionPct > 40 ? "a comfortable, steady pace."
            : "Inoot keeps your steps extra small to match your rhythm."
          }`} />
      )}
      <PatternRow emoji="📋" label="Task complexity" value={complexityLabels[patterns.preferredComplexity]} />
      <PatternRow emoji="⏸️" label="Pausing tasks" value={pauseLabels[patterns.pauseFrequency]} />
      <p className="text-xs text-[#B2BEC3] pt-3 border-t border-[#F0F0F0] mt-2 leading-relaxed">
        Inoot uses these patterns silently to shape your task breakdowns — they don&apos;t appear in the UI.
      </p>
    </div>
  )
}

// ─── 7. Your Data ─────────────────────────────────────────────────────────────

function YourDataSection() {
  const router = useRouter()
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleResetPreferences() {
    if (resetting) return
    setResetting(true)
    setResetMsg(null)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tonePreference: "SUPPORTIVE",
          taskDetailLevel: "detailed",
          reminderFrequency: "gentle",
          showEncouragement: true,
          showOptionalEncouragement: false,
          fontSizePreference: "default",
          reducedMotion: false,
          highContrast: false,
        }),
      })
      if (res.ok) {
        setResetMsg("Preferences reset to defaults.")
        setTimeout(() => setResetMsg(null), 3000)
        // Revert DOM accessibility attributes
        const root = document.documentElement
        root.style.fontSize = ""
        root.removeAttribute("data-reduced-motion")
        root.removeAttribute("data-high-contrast")
      }
    } finally {
      setResetting(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/user", { method: "DELETE" })
      if (res.ok) {
        await signOut({ redirect: false })
        router.push("/auth/login")
      } else {
        setDeleteError("Couldn't delete your account right now. Please try again.")
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Reset preferences */}
      <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔄</span>
          <span className="text-sm font-medium text-[#2D3436]">Reset preferences</span>
        </div>
        <p className="text-xs text-[#636E72] leading-relaxed">
          Resets all your Inoot preferences (tone, detail level, reminders, accessibility) back to their defaults.
          Your tasks and task history are not affected.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetPreferences}
            disabled={resetting}
            className={cn(
              "px-4 py-2 text-sm rounded-xl border border-[#DFE6E9] text-[#636E72]",
              "hover:border-[#B2BEC3] transition-colors min-h-[44px]",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
              resetting && "opacity-50 cursor-not-allowed"
            )}
          >
            {resetting ? "Resetting…" : "Reset to defaults"}
          </button>
          {resetMsg && (
            <span role="status" aria-live="polite" className="text-xs text-[#81C995]">
              {resetMsg}
            </span>
          )}
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🗑️</span>
          <span className="text-sm font-medium text-[#2D3436]">Delete account</span>
        </div>
        <p className="text-xs text-[#636E72] leading-relaxed">
          Permanently deletes your account and all associated tasks. This can&apos;t be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className={cn(
              "px-4 py-2 text-sm rounded-xl border border-[#E07070]/30 text-[#E07070]/80",
              "hover:border-[#E07070]/60 hover:text-[#E07070] transition-colors min-h-[44px]",
              "focus-visible:outline-2 focus-visible:outline-[#E07070] focus-visible:outline-offset-2"
            )}
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#E07070]/5 border border-[#E07070]/20">
            <p className="text-sm text-[#636E72]">
              This will permanently delete your account and all your tasks. Are you sure?
            </p>
            {deleteError && (
              <p role="alert" className="text-xs text-[#E07070]">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl bg-[#E07070] text-white min-h-[44px]",
                  "hover:bg-[#cf5f5f] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-[#E07070] focus-visible:outline-offset-2",
                  deleting && "opacity-60 cursor-not-allowed"
                )}
              >
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl border border-[#DFE6E9] text-[#636E72]",
                  "hover:border-[#B2BEC3] transition-colors min-h-[44px]",
                  "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2"
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-4">
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-1/3 bg-[#DFE6E9] rounded-full" />
          <div className="h-4 w-1/2 bg-[#DFE6E9] rounded-full" />
          <div className="h-4 w-1/4 bg-[#DFE6E9] rounded-full" />
        </div>
      ) : (
        <dl className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Name</dt>
            <dd className="text-sm text-[#2D3436]">{user?.name ?? "—"}</dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Email</dt>
            <dd className="text-sm text-[#2D3436] break-all">{user?.email ?? "—"}</dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Member since</dt>
            <dd className="text-sm text-[#2D3436]">
              {user?.createdAt ? formatDate(user.createdAt) : "—"}
            </dd>
          </div>
        </dl>
      )}
      <p className="text-xs text-[#B2BEC3] pt-2 border-t border-[#DFE6E9]">
        Account editing and password changes are coming in a future update.
      </p>
    </div>
  )
}

// ─── Main settings page ───────────────────────────────────────────────────────

function SettingsPageContent() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436]">Settings</h1>
        <p className="text-sm text-[#636E72] mt-1">Manage your account and preferences.</p>
      </div>

      {/* 1. Account */}
      <Section title="Your account">
        <AccountCard />
      </Section>

      {/* 2. AI Tone */}
      <Section title="AI tone">
        <AIToneCard />
      </Section>

      {/* 3. Task Detail Level */}
      <Section title="Task detail level">
        <TaskDetailLevelCard />
      </Section>

      {/* 4. Encouragement */}
      <Section title="Encouragement &amp; Reassurance">
        <EncouragementSection />
      </Section>

      {/* 5. Reminders */}
      <Section title="Reminders">
        <ReminderPreference />
      </Section>

      {/* 6. Accessibility */}
      <Section title="Accessibility">
        <AccessibilityCard />
      </Section>

      {/* 7. What Inoot has noticed */}
      <Section title="What Inoot has noticed">
        <LearnedPatterns />
      </Section>

      {/* 8. Your Data */}
      <Section title="Your data">
        <YourDataSection />
      </Section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full pb-20">
          <SettingsPageContent />
        </main>
      </div>
    </AuthGuard>
  )
}
