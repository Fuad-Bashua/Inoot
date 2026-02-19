"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/task/new", label: "New task" },
  { href: "/settings", label: "Settings" },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Active check: exact for dashboard/settings, prefix for task routes
  function isActive(href: string) {
    if (href === "/task/new") return pathname === "/task/new"
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#DFE6E9] safe-area-top">
      <nav
        className="max-w-[768px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-1 sm:gap-5 min-w-0">
          {/* Wordmark */}
          <Link
            href="/dashboard"
            className="font-semibold text-[#2D3436] hover:text-[#6B8F9E] transition-colors
                       min-h-[44px] flex items-center flex-none mr-1 sm:mr-2"
            aria-label="Inoot — home"
          >
            Inoot
          </Link>

          {/* Nav links — only shown when logged in */}
          {session?.user && (
            <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-center",
                      "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                      active
                        ? "text-[#6B8F9E] font-medium bg-[#6B8F9E]/8"
                        : "text-[#636E72] hover:text-[#2D3436] hover:bg-[#F8F9FA]"
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: user name + log out */}
        {session?.user && (
          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            <span
              className="text-sm text-[#636E72] hidden md:block truncate max-w-[120px]"
              aria-hidden="true"
            >
              {session.user.name}
            </span>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center
                         px-3 text-sm text-[#636E72] hover:text-[#2D3436]
                         transition-colors rounded-lg
                         focus-visible:outline-2 focus-visible:outline-[#6B8F9E]
                         focus-visible:outline-offset-2"
              aria-label="Log out"
            >
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}
