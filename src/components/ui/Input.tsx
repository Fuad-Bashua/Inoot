import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
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
          className="text-sm font-medium text-[#2D3436]"
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="text-xs text-[#636E72] -mt-0.5">
            {hint}
          </p>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            // 16px font prevents iOS auto-zoom on focus
            "w-full px-4 rounded-xl text-[#2D3436] text-base bg-white border",
            // 44px min height for touch target
            "min-h-[44px]",
            "placeholder:text-[#B2BEC3]",
            "transition-colors",
            // Teal focus ring, no browser default
            "outline-none focus:ring-2 focus:ring-[#6B8F9E] focus:ring-offset-0",
            !error && "border-[#DFE6E9] focus:border-[#6B8F9E]",
            error  && "border-[#E07070] focus:ring-[#E07070]",
            className
          )}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-[#E07070] leading-snug"
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
