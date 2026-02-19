"use client"

import { useEffect } from "react"

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // SW registration failing silently is acceptable
        })
      })
    }
  }, [])

  return null
}
