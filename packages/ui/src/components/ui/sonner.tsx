"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "next-themes"

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme ?? "light") as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!border-border !bg-card !text-card-foreground",
          description: "!text-muted-foreground",
          success: "!border-status-operational/30",
          error: "!border-status-outage/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from "sonner"
