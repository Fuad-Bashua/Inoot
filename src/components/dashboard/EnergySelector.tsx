"use client"

import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnergyMode = "focused" | "normal" | "low"

export const ENERGY_STORAGE_KEY = "inoot_energy_mode"

/** Read the stored energy mode from localStorage (safe for SSR). */
export function getStoredEnergyMode(): EnergyMode {
  if (typeof window === "undefined") return "normal"
  return (localStorage.getItem(ENERGY_STORAGE_KEY) as EnergyMode) ?? "normal"
}

/** Persist the energy mode to localStorage. */
export function storeEnergyMode(mode: EnergyMode) {
  if (typeof window === "undefined") return
  localStorage.setItem(ENERGY_STORAGE_KEY, mode)
}

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES: {
  value: EnergyMode
  emoji: string
  label: string
  sublabel: string
}[] = [
  {
    value: "focused",
    emoji: "🎯",
    label: "Focused today",
    sublabel: "Show me everything.",
  },
  {
    value: "normal",
    emoji: "✨",
    label: "Normal day",
    sublabel: "The usual.",
  },
  {
    value: "low",
    emoji: "🌙",
    label: "Low energy",
    sublabel: "Keep it simple.",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface EnergySelectorProps {
  value: EnergyMode
  onChange: (mode: EnergyMode) => void
}

export function EnergySelector({ value, onChange }: EnergySelectorProps) {
  return (
    <div
      role="group"
      aria-label="How are you feeling today?"
      className="flex gap-2 flex-wrap"
    >
      {MODES.map((mode) => {
        const isActive = value === mode.value
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition-all",
              "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
              "min-h-[44px]",
              isActive
                ? "border-[#6B8F9E] bg-[#6B8F9E]/8 text-[#2D3436] font-medium shadow-sm"
                : "border-[#DFE6E9] text-[#636E72] hover:border-[#B2BEC3] bg-white"
            )}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {mode.emoji}
            </span>
            <span className="leading-none">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
