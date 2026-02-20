"use client"

import { useEffect } from "react"

/**
 * Reads accessibility preferences from /api/preferences and applies
 * data attributes to <html> so that CSS selectors in globals.css can
 * scale fonts, increase contrast, and disable motion.
 *
 * This component renders nothing — it's a side-effect only component.
 * It's mounted once in the root layout so it runs on every page load.
 */
export function AccessibilityApplier() {
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return
        const prefs = d.data as {
          fontSizePreference?: string
          reducedMotion?: boolean
          highContrast?: boolean
        }
        const root = document.documentElement

        // Apply font size via inline style (more reliable than CSS attr selectors in Tailwind v4)
        const fontSizeMap: Record<string, string> = { large: "112.5%", xl: "125%" }
        root.style.fontSize = fontSizeMap[prefs.fontSizePreference ?? ""] ?? ""

        if (prefs.reducedMotion) {
          root.setAttribute("data-reduced-motion", "true")
        } else {
          root.removeAttribute("data-reduced-motion")
        }

        if (prefs.highContrast) {
          root.setAttribute("data-high-contrast", "true")
        } else {
          root.removeAttribute("data-high-contrast")
        }
      })
      .catch(() => {
        // Not logged in or network error — silently ignore
      })
  }, [])

  return null
}
