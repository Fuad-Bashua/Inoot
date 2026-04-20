"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface StreamingBreakdownProps {
  /** Raw accumulated text from the Claude stream */
  streamText: string
  /** True once the stream has ended (used to show the finalising state) */
  isComplete: boolean
}

// ── Extract guidance text from partial / complete JSON ────────────────────────
// The JSON looks like: { "taskTitle": "...", "guidance": "Here's a plan...", ... }
// We pull whatever has been generated for the guidance value so far.
function extractGuidance(text: string): string {
  const marker = '"guidance":'
  const start = text.indexOf(marker)
  if (start === -1) return ""

  const afterMarker = text.slice(start + marker.length).trimStart()
  if (!afterMarker.startsWith('"')) return ""

  // Walk through the JSON string value, handling escape sequences
  let result = ""
  let i = 1 // skip opening "
  while (i < afterMarker.length) {
    const c = afterMarker[i]
    if (c === "\\") {
      const next = afterMarker[i + 1]
      if (next === '"') { result += '"'; i += 2 }
      else if (next === "n") { result += "\n"; i += 2 }
      else if (next === "t") { result += "\t"; i += 2 }
      else if (next === "\\") { result += "\\"; i += 2 }
      else { result += next; i += 2 }
    } else if (c === '"') {
      break // end of JSON string
    } else {
      result += c
      i++
    }
  }
  return result
}

// ── Pulsing skeleton shown before guidance text arrives ───────────────────────
function PreStreamSkeleton() {
  const [dotCount, setDotCount] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDotCount((n) => (n % 3) + 1), 600)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="w-full py-12 flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Generating your task breakdown"
    >
      <div className="loader-dots" aria-hidden="true"><span /><span /><span /></div>
      <p className="text-sm text-[#636E72] text-center">
        Putting your plan together{"...".slice(0, dotCount)}
      </p>
    </div>
  )
}

// ── Main streaming view shown once guidance text starts arriving ───────────────
export function StreamingBreakdown({ streamText, isComplete }: StreamingBreakdownProps) {
  const guidance = extractGuidance(streamText)

  // Before the guidance field appears in the stream, keep showing the skeleton
  if (!guidance) {
    return <PreStreamSkeleton />
  }

  return (
    <div
      className="w-full py-8 flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Generating your task breakdown"
    >
      {/* Streaming card */}
      <div className="w-full max-w-md soft-glass-card rounded-2xl p-6 space-y-3">
        <p className="text-xs font-medium text-[#6B8F9E] uppercase tracking-wide">
          Writing your plan
        </p>

        {/* The guidance text — builds up as Claude streams */}
        <p
          key={guidance.length}
          className="text-sm text-[#2D3436] leading-relaxed whitespace-pre-wrap animate-[fade-in-up_0.15s_ease-out]"
        >
          {guidance}
          {/* Blinking cursor shown while still streaming */}
          {!isComplete && (
            <span
              className="inline-block ml-0.5 w-[2px] h-[14px] bg-[#6B8F9E] align-middle animate-[cursor-blink_1s_step-end_infinite]"
              aria-hidden="true"
            />
          )}
        </p>
      </div>

      {/* Status line */}
      <div className="loader-dots" aria-hidden="true"><span /><span /><span /></div>
      <p className={cn("text-sm text-[#636E72] text-center transition-opacity duration-300",
        isComplete && "opacity-60"
      )}>
        {isComplete
          ? "Almost done — saving your plan…"
          : "Building your steps…"}
      </p>
    </div>
  )
}
