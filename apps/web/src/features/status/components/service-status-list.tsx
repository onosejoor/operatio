import { PublicMonitor } from "../types/public-status";
import { monitorStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";
import { Badge } from "@operatio/ui/components/ui/badge";

export function MonitorRow({ monitor }: { monitor: PublicMonitor }) {
  const config = monitorStatusConfig[monitor.status];

  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">{monitor.name}</span>
          {monitor.responseTime != null && (
            <span className="text-xs text-muted-foreground">
              {monitor.responseTime}ms avg
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {monitor.uptime != null && (
            <span className="text-xs text-muted-foreground">
              {monitor.uptime.toFixed(2)}% (90d)
            </span>
          )}
          <Badge variant="outline" className="gap-1.5 font-normal">
            <StatusDot className={config.dotClass} pulse={monitor.status === "DOWN"} />
            <span className={config.textClass}>{config.label}</span>
          </Badge>
        </div>
      </div>

      {monitor.dailyUptime && monitor.dailyUptime.length > 0 && (
        <UptimeBars data={monitor.dailyUptime} />
      )}
    </div>
  );
}
