import Link from "next/link"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {/* Soft decorative element */}
      <div
        className="w-16 h-16 rounded-full bg-[#F8F9FA] border border-[#DFE6E9] flex items-center
                   justify-center text-2xl mb-6"
        aria-hidden="true"
      >
        🌱
      </div>

      <h2 className="text-lg font-medium text-[#2D3436] mb-2">
        Nothing here yet — and that&apos;s okay.
      </h2>
      <p className="text-sm text-[#636E72] leading-relaxed max-w-xs">
        When you&apos;re ready, add your first task and we&apos;ll help you break it down into
        manageable steps.
      </p>

      <Link
        href="/task/new"
        className="mt-8 px-6 py-3 bg-[#6B8F9E] text-white rounded-xl text-sm font-medium
                   hover:bg-[#5A7D8C] transition-colors"
      >
        Add your first task
      </Link>
    </div>
  )
}
