import { DailyUptime } from "../types/public-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@operatio/ui/components/tooltip";
import { cn } from "@operatio/ui/lib/utils";
import { format, formatDistanceStrict } from "date-fns";

function barColor(day: DailyUptime) {
  const pct = day.uptimePercentage;
  if (pct === null || pct === undefined) return "bg-muted/40";

  // Strict semantics: if there was any failure, even for a minute, it must not be green
  const hasFailures =
    (day.failureCount && day.failureCount > 0) ||
    (day.downDurationMinutes && day.downDurationMinutes > 0) ||
    pct < 100;
  if (!hasFailures) {
    return "bg-status-operational";
  }

  // If degraded or minor outage
  if (pct >= 95) {
    return "bg-status-degraded";
  }
  return "bg-status-outage";
}

function getTooltipText(day: DailyUptime) {
  if (!day.date) return "No data";
  const dateObj = new Date(day.date);
  const formattedDate = format(dateObj, "MMM d, yyyy");
  const isToday = new Date().toISOString().split("T")[0] === day.date;
  const datePrefix = isToday ? `${formattedDate} (Today)` : formattedDate;
  const pct = day.uptimePercentage;
  if (pct === null || pct === undefined) return `${datePrefix}: No data`;

  const hasFailures =
    (day.failureCount && day.failureCount > 0) ||
    (day.downDurationMinutes && day.downDurationMinutes > 0) ||
    pct < 100;

  if (!hasFailures) {
    return `${datePrefix}: 100% uptime (Operational)`;
  }

  // Calculate down minutes
  const downMins =
    day.downDurationMinutes != null && day.downDurationMinutes > 0
      ? day.downDurationMinutes
      : Math.max(1, Math.round(((100 - pct) / 100) * 1440));

  const distance = formatDistanceStrict(0, downMins * 60 * 1000);
  const statusLabel = pct >= 95 ? "Degraded" : "Outage";
  return `${datePrefix}: ${pct.toFixed(2)}% uptime (${statusLabel} \n Down for ${distance})`;
}

export function UptimeBars({
  data,
  className,
}: {
  data: DailyUptime[];
  className?: string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <TooltipProvider delay={50}>
        <div className="flex h-7 w-full items-end gap-0.5 overflow-hidden rounded-sm">
          {data.map((day) => {
            const tooltipText = getTooltipText(day);

            return (
              <Tooltip key={day.date}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "h-full flex-1 rounded-[1.5px] transition-all hover:scale-y-110 hover:opacity-100 opacity-85 cursor-pointer",
                        barColor(day),
                      )}
                      role="img"
                      aria-label={tooltipText}
                    />
                  }
                />
                <TooltipContent
                  side="top"
                  className="font-mono shadow-lg whitespace-break-spaces font-medium"
                >
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Axis metadata */}
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
        <span>{data.length} days ago</span>
        <span className="hidden sm:inline">Rolling 90-Day History</span>
        <span>Today</span>
      </div>
    </div>
  );
}
