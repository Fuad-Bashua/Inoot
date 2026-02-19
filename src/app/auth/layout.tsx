export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* Full-screen bg, centred — 16px padding on mobile, 24px on sm+ */
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
      <div className="w-full max-w-[450px]">
        {/* Wordmark */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-2xl font-semibold text-[#2D3436]">Inoot</span>
          <p className="text-sm text-[#636E72] mt-1">Your calm task assistant</p>
        </div>

        {/* Card — less padding on mobile so it breathes without bleeding */}
        <div className="bg-white rounded-xl shadow-sm border border-[#DFE6E9] p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
