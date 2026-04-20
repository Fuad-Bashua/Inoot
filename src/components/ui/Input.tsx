import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  variant?: "default" | "glass" | "title"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, variant = "default", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-")
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const describedBy = [
      hint ? hintId : "",
      error ? errorId : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium",
            variant === "glass" ? "text-white/90" : "text-[#2D3436]"
          )}
        >
          {label}
        </label>

        {hint && (
          <p
            id={hintId}
            className={cn(
              "text-xs -mt-0.5",
              variant === "glass" ? "text-white/65" : "text-[#636E72]"
            )}
          >
            {hint}
          </p>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full text-base transition-colors outline-none",
            variant === "default" &&
              "px-4 rounded-xl text-[#2D3436] bg-white border min-h-[44px] placeholder:text-[#B2BEC3] focus:ring-2 focus:ring-[#6B8F9E] focus:ring-offset-0",
            variant === "title" &&
              "px-0 min-h-[52px] text-[22px] font-semibold text-[#2D3436] bg-transparent border-0 border-b-2 rounded-none placeholder:text-[#B0B8BF]",
            variant === "glass" &&
              "glass-input min-h-[48px] px-1.5 text-white placeholder:text-white/55 focus:ring-0",
            variant === "default" && !error && "border-[#DFE6E9] focus:border-[#6B8F9E]",
            variant === "default" && error && "border-[#F0C674] focus:ring-[#F0C674]",
            variant === "title" && !error && "border-b-[rgba(99,110,114,0.35)] focus:border-b-[#6B8F9E]",
            variant === "title" && error && "border-b-[#F0C674]",
            variant === "glass" && error && "border-b-[#F0C674]",
            className
          )}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-[#636E72] leading-snug"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
