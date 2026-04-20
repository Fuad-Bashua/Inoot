import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen dark-hero-bg flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-3xl text-center space-y-7 motion-page-enter">
        <p className="text-[28px] font-bold text-white tracking-tight">
          Inoot<span className="text-[#6B8F9E]">.</span>
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.01em] text-white leading-tight">
          Your calm, adaptive task assistant
        </h1>

        <p className="text-[18px] text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
          Built to help you manage academic, career, and personal tasks without overwhelm.
          Break big tasks into smaller steps and keep moving at your own pace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
          <Link
            href="/auth/signup"
            className="saas-button-primary motion-button-scale flex items-center justify-center min-h-[48px] px-7 rounded-xl font-semibold"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center justify-center min-h-[48px] px-7 border border-white/25 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors motion-button-scale"
          >
            Log in
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 pt-3 text-sm text-white/70">
          <p>AI-powered breakdowns</p>
          <p>Neurodivergent-first</p>
          <p>Calm by design</p>
        </div>
      </div>
    </main>
  )
}
