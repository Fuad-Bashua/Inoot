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
      {/* Pulsing card skeleton */}
      <div className="w-full max-w-md space-y-4">
        <div className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3 animate-pulse">
          <div className="h-3 w-1/3 bg-[#DFE6E9] rounded-full" />
          <div className="h-4 w-3/4 bg-[#DFE6E9] rounded-lg" />
          <div className="h-3 w-full bg-[#DFE6E9] rounded-full" />
          <div className="h-3 w-5/6 bg-[#DFE6E9] rounded-full" />
        </div>
        <div className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3 animate-pulse opacity-70">
          <div className="h-4 w-2/3 bg-[#DFE6E9] rounded-lg" />
          <div className="h-3 w-full bg-[#DFE6E9] rounded-full" />
          <div className="h-3 w-4/5 bg-[#DFE6E9] rounded-full" />
        </div>
        <div className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3 animate-pulse opacity-40">
          <div className="h-4 w-1/2 bg-[#DFE6E9] rounded-lg" />
          <div className="h-3 w-full bg-[#DFE6E9] rounded-full" />
        </div>
      </div>

      {/* Rotating message */}
      <p className="text-sm text-[#636E72] text-center transition-opacity duration-500">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
