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
    <header className="sticky top-0 z-50 bg-white/95 border-b border-[#DFE6E9] safe-area-top backdrop-blur-sm">
      <nav
        className="max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Left: logo */}
        <div className="flex items-center gap-1 min-w-0">
          {/* Wordmark */}
          <Link
            href="/dashboard"
            className="font-bold text-[1.75rem] text-[#2D3436] hover:text-[#6B8F9E] transition-colors min-h-[44px] flex items-center flex-none tracking-tight"
            aria-label="Inoot — home"
          >
            Inoot<span className="text-[#6B8F9E] ml-0.5">.</span>
          </Link>
        </div>

        {/* Nav links — centered */}
        {session?.user && (
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-center border-b-2",
                      "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
                      active
                        ? "text-[#2D3436] font-semibold border-b-[#6B8F9E]"
                        : "text-[#636E72] border-b-transparent hover:text-[#2D3436] hover:bg-[#F8F9FA]"
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Right: user name + log out */}
        {session?.user && (
          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            <span
              className="text-sm text-[#636E72] hidden md:block truncate max-w-[120px]"
              aria-hidden="true"
            >
              {session.user.name}
            </span>

            <Link
              href="/settings"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#DFE6E9] flex items-center justify-center text-[#636E72] hover:text-[#2D3436] hover:border-[#B2BEC3] transition-colors"
              aria-label="Open settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6.7 1.9h2.6l.3 1.6a4.8 4.8 0 0 1 1 .6l1.5-.6 1.3 2.2-1.2 1a5.2 5.2 0 0 1 0 1.3l1.2 1-1.3 2.2-1.5-.6a4.8 4.8 0 0 1-1 .6l-.3 1.6H6.7l-.3-1.6a4.8 4.8 0 0 1-1-.6l-1.5.6-1.3-2.2 1.2-1a5.2 5.2 0 0 1 0-1.3l-1.2-1 1.3-2.2 1.5.6a4.8 4.8 0 0 1 1-.6L6.7 1.9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center
                         px-3 text-sm text-[#636E72] hover:text-[#2D3436] border border-[#DFE6E9]
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
