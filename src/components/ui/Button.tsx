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
    "saas-button-primary motion-button-scale hover:brightness-105 disabled:hover:brightness-100",
  secondary:
    "bg-white text-[#6B8F9E] border border-[#6B8F9E]/40 hover:bg-[#6B8F9E]/8 disabled:hover:bg-white motion-button-scale",
  danger:
    "bg-white text-[#2D3436] border border-[#F0C674] hover:bg-[#F0C674]/20 disabled:hover:bg-white motion-button-scale",
}

const sizeStyles: Record<ButtonSize, string> = {
  // py ensures min 44px tap height on mobile without inflating desktop
  sm: "px-4 py-2.5 text-sm min-h-[44px]",
  md: "px-6 py-3 text-base min-h-[48px]",
  lg: "px-8 py-4 text-base min-h-[48px]",
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
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all tracking-[0.01em]",
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
