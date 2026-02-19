"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { formatDate } from "@/lib/utils"

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
}

const COMING_SOON_PREFERENCES = [
  {
    title: "AI Tone",
    description:
      "Choose how Inoot speaks to you — supportive and warm, structured and concise, or casual and friendly.",
    icon: "💬",
  },
  {
    title: "Reminders",
    description:
      "Set gentle nudges for when you want to check in on your tasks — no pressure, just a quiet prompt.",
    icon: "🔔",
  },
  {
    title: "Accessibility",
    description:
      "Adjust font size, contrast, and motion settings to make Inoot work best for you.",
    icon: "♿",
  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-[#2D3436]">{title}</h2>
      {children}
    </section>
  )
}

function SettingsPageContent() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data)
      })
      .catch(() => {/* silently ignore — we still show the rest of the page */})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-10">
      {/* Page heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436]">Settings</h1>
        <p className="text-sm text-[#636E72] mt-1">Manage your account and preferences.</p>
      </div>

      {/* Section 1 — Account */}
      <Section title="Your account">
        <div className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-1/3 bg-[#DFE6E9] rounded-full" />
              <div className="h-4 w-1/2 bg-[#DFE6E9] rounded-full" />
              <div className="h-4 w-1/4 bg-[#DFE6E9] rounded-full" />
            </div>
          ) : (
            <dl className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Name</dt>
                <dd className="text-sm text-[#2D3436]">{user?.name ?? "—"}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Email</dt>
                <dd className="text-sm text-[#2D3436] break-all">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                <dt className="text-sm font-medium text-[#636E72] sm:w-32 flex-none">Member since</dt>
                <dd className="text-sm text-[#2D3436]">
                  {user?.createdAt ? formatDate(user.createdAt) : "—"}
                </dd>
              </div>
            </dl>
          )}

          <p className="text-xs text-[#B2BEC3] pt-2 border-t border-[#DFE6E9]">
            Account editing and password changes are coming in a future update.
          </p>
        </div>
      </Section>

      {/* Section 2 — Preferences (coming soon) */}
      <Section title="Preferences">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON_PREFERENCES.map((pref) => (
            <div
              key={pref.title}
              className="bg-white border border-[#DFE6E9] rounded-xl p-5 space-y-2 opacity-60"
              aria-label={`${pref.title} — coming soon`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{pref.icon}</span>
                  <span className="text-sm font-medium text-[#2D3436]">{pref.title}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#DFE6E9] text-[#636E72] whitespace-nowrap">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-[#636E72] leading-relaxed">{pref.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#B2BEC3]">
          These features will be available in a future update.
        </p>
      </Section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <SettingsPageContent />
        </main>
      </div>
    </AuthGuard>
  )
}
