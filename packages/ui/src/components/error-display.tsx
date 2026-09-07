import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "cn"

interface ErrorDisplayProps {
  title?: string
  message?: string
  /** If provided, shows a link button (e.g. for 404s -> "/") */
  url?: string
  urlLabel?: string
  /** If true, shows a "Try again" button that reloads the page */
  onRetry?: () => void
  className?: string
  fullScreen?: boolean
}

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  url,
  urlLabel = "Go back home",
  onRetry,
  className,
  fullScreen = false,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 text-center",
        fullScreen ? "min-h-screen w-full" : "w-full py-12",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>

      {(url || onRetry) && (
        <div className="mt-2 flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          {url && (
            <Button size="sm">
              <a href={url}>{urlLabel}</a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
