"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function LoadingSkeleton() {
  return (
    <div className="max-w-[768px] mx-auto px-6 py-12 space-y-6" aria-label="Loading…" aria-busy="true">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-[#DFE6E9] rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-[#DFE6E9] rounded-md animate-pulse" />
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2">
        {[80, 96, 76, 88].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-[#DFE6E9] animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-3"
          >
            <div className="h-4 w-20 bg-[#DFE6E9] rounded-full animate-pulse" />
            <div className="h-5 w-3/4 bg-[#DFE6E9] rounded-lg animate-pulse" />
            <div className="h-2 w-full bg-[#DFE6E9] rounded-full animate-pulse" />
            <div className="h-3 w-24 bg-[#DFE6E9] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <LoadingSkeleton />
  }

  if (status === "unauthenticated") {
    // Redirect is happening — render nothing to avoid flash
    return null
  }

  return <>{children}</>
}
