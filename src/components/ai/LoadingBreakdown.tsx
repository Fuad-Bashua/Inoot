"use client"

import { useEffect, useState } from "react"

const MESSAGES = [
  "Taking a closer look at your task...",
  "Breaking things down into smaller steps...",
  "Almost there — putting together your plan...",
]

export function LoadingBreakdown() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="w-full py-12 flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Generating your task breakdown"
    >
      <div className="loader-dots" aria-hidden="true"><span /><span /><span /></div>

      {/* Rotating message */}
      <p className="text-sm text-[#636E72] text-center animate-[crossfade_2.5s_ease-in-out_infinite]">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
