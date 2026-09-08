import { DailyUptime } from "../types/public-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@operatio/ui/components/tooltip";
import { cn } from "@operatio/ui/lib/utils";
import { format } from "date-fns";

function barColor(pct?: number | null) {
  if (pct === null || pct === undefined) return "bg-muted/40";
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

function getMonthLabels(data: DailyUptime[]): string[] {
  if (data.length === 0) return [];

  // Get unique months from the data (at most 4 labels)
  const uniqueMonths = new Set<string>();
  data.forEach((day) => {
    uniqueMonths.add(format(new Date(day.date), "MMM"));
  });

  // Convert to array and take first 3, plus last
  const monthArray = Array.from(uniqueMonths);
  if (monthArray.length <= 4) {
    return monthArray;
  }

  // Take first 3 and last
  return [...monthArray.slice(0, 3), monthArray[monthArray.length - 1]];
}

export function UptimeBars({
  data,
  className,
}: {
  data: DailyUptime[];
  className?: string;
}) {
  const monthLabels = getMonthLabels(data);

  return (
    <div className={cn("w-full", className)}>
      <TooltipProvider>
        <div className="flex h-8 w-full items-end gap-[2px]">
          {data.map((day) => {
            const tooltipText = getTooltipText(day.uptimePercentage, day.date);

            return (
              <Tooltip key={day.date}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "h-full flex-1 rounded-[2px] transition-all hover:opacity-80 cursor-pointer",
                        barColor(day.uptimePercentage),
                      )}
                      role="img"
                      aria-label={tooltipText}
                    />
                  }
                />
                <TooltipContent side="top">{tooltipText}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data.length} days ago</span>
        <div className="flex gap-4">
          {monthLabels.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}
