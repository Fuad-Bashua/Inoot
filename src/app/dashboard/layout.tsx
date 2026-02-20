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
      <div className="min-h-screen bg-[#F8F9FA]">
        <Navbar />
        <main className="max-w-[768px] mx-auto px-6 md:px-12 py-8 md:py-12">
          {children}
        </main>
        {/* Idle encouragement — shown once per session if opt-in is enabled */}
        <IdleEncouragement />
      </div>
    </AuthGuard>
  )
}
