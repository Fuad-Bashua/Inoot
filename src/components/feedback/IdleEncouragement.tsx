"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

// ─── Config ───────────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 60_000 // 60 seconds
const SESSION_KEY = "inoot_idle_shown"

const IDLE_MESSAGES = [
  "Taking your time is fine. There's no rush here.",
  "If you're not sure where to start, just pick the first step.",
  "No pressure — whenever you're ready is the right time.",
]

const INTERACTION_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function IdleEncouragement() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  // Pick a message once on mount so it stays stable across re-renders
  const [message] = useState(
    () => IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownThisSessionRef = useRef(false)

  // ── Check preference on mount ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.showOptionalEncouragement === true) {
          setEnabled(true)
        }
      })
      .catch(() => {
        // Network error or not logged in — silently skip
      })
  }, [])

  // ── Idle detection ──────────────────────────────────────────────────────
  const hasBeenShown = useCallback((): boolean => {
    if (shownThisSessionRef.current) return true
    try {
      return !!sessionStorage.getItem(SESSION_KEY)
    } catch {
      return true // If sessionStorage is unavailable, don't show
    }
  }, [])

  const markShown = useCallback(() => {
    shownThisSessionRef.current = true
    try {
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      /* ignore */
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!hasBeenShown()) {
        markShown()
        setVisible(true)
      }
    }, IDLE_TIMEOUT_MS)
  }, [hasBeenShown, markShown])

  useEffect(() => {
    if (!enabled || hasBeenShown()) return

    // Start the timer and reset it on any interaction
    startTimer()
    INTERACTION_EVENTS.forEach((ev) =>
      window.addEventListener(ev, startTimer, { passive: true })
    )

    return () => {
      INTERACTION_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, startTimer)
      )
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, startTimer, hasBeenShown])

  if (!visible || !enabled) return null

  return (
    <div
      role="note"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3",
        "bg-white border border-[#DFE6E9] rounded-xl shadow-md",
        "max-w-[340px] w-[calc(100%-2rem)]",
        "animate-[fadeIn_0.4s_ease-in-out]"
      )}
    >
      <p className="text-sm text-[#636E72] leading-relaxed flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss message"
        className={cn(
          "flex-none p-1.5 text-[#B2BEC3] hover:text-[#636E72] transition-colors",
          "rounded focus-visible:outline-2 focus-visible:outline-[#6B8F9E]",
          "min-h-[36px] min-w-[36px] flex items-center justify-center"
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M2 2l10 10M12 2 2 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
