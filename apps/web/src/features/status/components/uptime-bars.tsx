import { DailyUptime } from "../types/public-status";
import { cn } from "@operatio/ui/lib/utils";

function barColor(pct?: number | null) {
  if (pct === null || pct === undefined) return "bg-muted";
  if (pct >= 99.5) return "bg-status-operational";
  if (pct >= 95) return "bg-status-degraded";
  return "bg-status-outage";
}

function getTooltipText(pct?: number | null, date?: string) {
  if (pct === null || pct === undefined) return `${date}: No data`;
  if (pct >= 99.5) return `${date}: ${pct.toFixed(2)}% uptime`;
  if (pct >= 95) return `${date}: ${pct.toFixed(2)}% uptime (degraded)`;
  return `${date}: ${pct.toFixed(2)}% uptime (outage)`;
}

export function UptimeBars({ data, className }: { data: DailyUptime[]; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-7 w-full items-center gap-[2px] rounded-md bg-muted/50 p-1">
        {data.map((day) => (
          <div
            key={day.date}
            className={cn(
              "h-full flex-1 rounded-[2px] transition-opacity hover:opacity-70 cursor-pointer",
              barColor(day.uptimePercentage),
            )}
            title={getTooltipText(day.uptimePercentage, day.date)}
            role="img"
            aria-label={getTooltipText(day.uptimePercentage, day.date)}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{data.length} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
