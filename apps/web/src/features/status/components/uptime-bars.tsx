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
  if (!date) return "No data";
  const formattedDate = format(new Date(date), "MMM d, yyyy");
  if (pct === null || pct === undefined) return `${formattedDate}: No checks logged`;
  if (pct >= 99.5) return `${formattedDate}: ${pct.toFixed(2)}% uptime (Operational)`;
  if (pct >= 95) return `${formattedDate}: ${pct.toFixed(2)}% uptime (Degraded)`;
  return `${formattedDate}: ${pct.toFixed(2)}% uptime (Outage detected)`;
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
        <div className="flex h-7 w-full items-end gap-[2px] overflow-hidden rounded-sm">
          {data.map((day) => {
            const tooltipText = getTooltipText(day.uptimePercentage, day.date);

            return (
              <Tooltip key={day.date}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "h-full flex-1 rounded-[1.5px] transition-all hover:scale-y-110 hover:opacity-100 opacity-85 cursor-pointer",
                        barColor(day.uptimePercentage),
                      )}
                      role="img"
                      aria-label={tooltipText}
                    />
                  }
                />
                <TooltipContent side="top" className="font-mono text-[11px] shadow-lg">
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
        <span className="hidden sm:inline">Rolling 90-Day SLA Window</span>
        <span>Today</span>
      </div>
    </div>
  );
}
