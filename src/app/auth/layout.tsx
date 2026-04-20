export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen dark-hero-bg flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
      <div className="w-full max-w-[720px] motion-page-enter">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[28px] font-bold tracking-tight text-white">
            Inoot<span className="text-[#6B8F9E]">.</span>
          </span>
          <p className="text-sm text-[#9CA3AF] mt-2">Your calm task assistant</p>
        </div>

        <div className="glass-card rounded-2xl shadow-glass p-6 sm:p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
