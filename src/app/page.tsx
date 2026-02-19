import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center space-y-5">
        {/* h1: 1.5rem on mobile → 1.75rem on sm+ (matches spec scale-down on small screens) */}
        <h1 className="text-[1.5rem] sm:text-[1.75rem] font-semibold text-[#2D3436] leading-tight">
          Inoot
        </h1>

        <p className="text-base sm:text-lg text-[#636E72] leading-relaxed">
          Your calm, adaptive task assistant. Built to help you manage
          academic, career, and personal tasks without the overwhelm.
        </p>

        <p className="text-sm sm:text-base text-[#636E72] leading-relaxed">
          Break big tasks into small steps. One step at a time.
        </p>

        {/* Stacked on mobile, side-by-side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/auth/signup"
            className="flex items-center justify-center min-h-[44px] px-6 py-3 bg-[#6B8F9E]
                       text-white rounded-xl font-medium hover:bg-[#5A7D8C] transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center justify-center min-h-[44px] px-6 py-3 border
                       border-[#DFE6E9] text-[#636E72] rounded-xl font-medium
                       hover:bg-white transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}
