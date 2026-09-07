import { Loader2 } from "lucide-react"
import { cn } from "cn"

interface LoaderDisplayProps {
  message?: string
  className?: string
  fullScreen?: boolean
}

export function LoaderDisplay({
  message = "Loading...",
  className,
  fullScreen = false,
}: LoaderDisplayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        fullScreen ? "min-h-screen w-full" : "w-full py-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
