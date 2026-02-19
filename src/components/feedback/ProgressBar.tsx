interface ProgressBarProps {
  progress: number
  className?: string
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
      className={`w-full h-2 rounded-full bg-[#DFE6E9] overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full bg-[#6B8F9E] transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
