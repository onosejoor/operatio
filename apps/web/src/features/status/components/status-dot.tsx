import { cn } from "@operatio/ui/lib/utils";

export function StatusDot({
  className,
  pulse = false,
}: {
  className: string;
  pulse?: boolean;
}) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            className,
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", className)} />
    </span>
  );
}
