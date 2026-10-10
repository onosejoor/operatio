"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "cn"

function Input({
  className,
  type,
  value,
  onChange,
  ...props
}: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"

  // If value is 0 or "0" or has leading zero like "05", strip or display cleanly as empty string
  let displayValue = value
  if (displayValue !== undefined && displayValue !== null) {
    if (displayValue === 0 || displayValue === "0") {
      displayValue = ""
    } else if (
      typeof displayValue === "string" &&
      /^0[0-9]/.test(displayValue)
    ) {
      displayValue = displayValue.replace(/^0+/, "")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If user starts typing or input value has leading 0, clean it up
    let val = e.target.value
    if (val === "0") {
      e.target.value = ""
    } else if (/^0[0-9]/.test(val)) {
      e.target.value = val.replace(/^0+/, "")
    }
    onChange?.(e)
  }

  const input = (
    <InputPrimitive
      type={isPassword && showPassword ? "text" : type}
      data-slot="input"
      value={displayValue}
      onChange={handleChange}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isPassword && "pr-9",
        className
      )}
      {...props}
    />
  )

  if (!isPassword) return input

  return (
    <div className="relative w-full">
      {input}
      <button
        type="button"
        data-slot="input-password-toggle"
        onClick={() => setShowPassword((current) => !current)}
        disabled={props.disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        {showPassword ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  )
}

export { Input }
