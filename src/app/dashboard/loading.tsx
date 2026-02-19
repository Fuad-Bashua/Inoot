// Next.js route-level loading UI — shown while the dashboard page suspends.
// Mirrors the real dashboard layout so there's no layout shift.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#DFE6E9] h-14" aria-hidden="true" />

      {/* Page content skeleton */}
      <div className="flex-grow max-w-[768px] mx-auto px-6 py-8 md:px-12 md:py-12 w-full">
        <div className="flex flex-col gap-8 animate-pulse">
          {/* Greeting */}
          <div className="space-y-2">
            <div className="h-7 w-40 bg-[#DFE6E9] rounded-lg" />
            <div className="h-4 w-56 bg-[#DFE6E9] rounded-full" />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2">
            {["All", "Academic", "Career", "Personal"].map((label) => (
              <div
                key={label}
                className="h-9 w-20 bg-[#DFE6E9] rounded-full"
                aria-label={`Loading ${label} filter`}
              />
            ))}
          </div>

          {/* Task card grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#DFE6E9] rounded-xl p-6 space-y-4"
                aria-hidden="true"
              >
                {/* Category badge */}
                <div className="h-5 w-20 bg-[#DFE6E9] rounded-full" />
                {/* Title */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-[#DFE6E9] rounded-lg" />
                  <div className="h-4 w-3/4 bg-[#DFE6E9] rounded-lg" />
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-[#DFE6E9] rounded-full" />
                {/* Steps done text */}
                <div className="h-3 w-24 bg-[#DFE6E9] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
