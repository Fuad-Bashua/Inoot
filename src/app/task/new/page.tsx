import Link from "next/link"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Navbar } from "@/components/layout/Navbar"
import { TaskInputForm } from "@/components/task/TaskInputForm"

export default function NewTaskPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2 rounded"
              aria-label="Back to dashboard"
            >
              ← Back
            </Link>
          </div>

          <div className="max-w-[560px]">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3436] mb-2">
              New task
            </h1>
            <p className="text-sm text-[#636E72] leading-relaxed mb-8">
              Describe what you need to do and I&apos;ll help break it down.
            </p>

            <TaskInputForm />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
