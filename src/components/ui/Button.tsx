import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Expand to full width — useful for mobile primary actions */
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#6B8F9E] text-white hover:bg-[#5A7D8C] disabled:hover:bg-[#6B8F9E]",
  secondary:
    "bg-white text-[#636E72] border border-[#DFE6E9] hover:bg-[#F8F9FA] disabled:hover:bg-white",
  danger:
    "bg-white text-[#E07070] border border-[#E07070] hover:bg-[#FDF2F2] disabled:hover:bg-white",
}

const sizeStyles: Record<ButtonSize, string> = {
  // py ensures min 44px tap height on mobile without inflating desktop
  sm: "px-4 py-2.5 text-sm min-h-[44px]",
  md: "px-6 py-3 text-base min-h-[44px]",
  lg: "px-8 py-4 text-base min-h-[44px]",
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        // Base
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-[#6B8F9E] focus-visible:outline-offset-2",
        // Disabled
        isDisabled && "opacity-50 cursor-not-allowed",
        // Full-width
        fullWidth && "w-full",
        // Variant + size
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
