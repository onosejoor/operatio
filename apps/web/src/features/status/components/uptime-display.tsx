import { PublicMonitor } from "../types/public-status";
import { Card } from "@operatio/ui/components/ui/card";
import { Progress } from "@operatio/ui/components/ui/progress";
import { cn } from "@operatio/ui/lib/utils";

interface UptimeDisplayProps {
  monitors: PublicMonitor[];
}

export function UptimeDisplay({ monitors }: UptimeDisplayProps) {
  if (monitors.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Uptime (30 days)
      </h3>
      <Card className="p-4 space-y-4">
        {monitors.map((monitor, index) => {
          const uptime = monitor.uptime ?? 100;
          const uptimeColor =
            uptime >= 99.9
              ? "bg-status-operational"
              : uptime >= 99
                ? "bg-status-degraded"
                : "bg-status-outage";

          return (
            <div key={`${monitor.name}-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  {monitor.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {uptime.toFixed(2)}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    uptimeColor
                  )}
                  style={{ width: `${uptime}%` }}
                  role="progressbar"
                  aria-label={`${monitor.name} uptime: ${uptime.toFixed(2)}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uptime}
                />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
