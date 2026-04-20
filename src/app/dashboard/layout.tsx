import { Navbar } from "@/components/layout/Navbar"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { IdleEncouragement } from "@/components/feedback/IdleEncouragement"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen app-shell">
        <Navbar />
        <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 md:py-10 motion-page-enter">
          {children}
        </main>
        {/* Idle encouragement — shown once per session if opt-in is enabled */}
        <IdleEncouragement />
      </div>
    </AuthGuard>
  )
}
