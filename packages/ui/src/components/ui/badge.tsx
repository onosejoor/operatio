import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@operatio/ui/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full border",
    "px-2.5 py-1",
    "text-[11px] leading-none font-medium tracking-wide",
    "whitespace-nowrap",
    "transition-colors",
    "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
  ],
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",

        secondary: "border-transparent bg-secondary text-secondary-foreground",

        destructive:
          "text-destructive-foreground border-transparent bg-destructive",

        outline: "border-border bg-background text-foreground",

        operational: [
          "border-status-operational/20",
          "bg-status-operational/10",
          "text-status-operational",
        ].join(" "),

        degraded: [
          "border-status-degraded/25",
          "bg-status-degraded/10",
          "text-status-degraded",
        ].join(" "),

        outage: [
          "border-status-outage/20",
          "bg-status-outage/10",
          "text-status-outage",
        ].join(" "),

        pending: "border-transparent bg-primary text-primary-foreground",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
