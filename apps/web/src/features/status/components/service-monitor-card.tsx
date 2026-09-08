import { PublicMonitor } from "../types/public-status";
import { monitorStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";

export function ServiceMonitorCard({ monitor }: { monitor: PublicMonitor }) {
  const config = monitorStatusConfig[monitor.status];

  return (
    <div className="py-6 border-b border-border/40 last:border-0 group">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-medium text-foreground">{monitor.name}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {monitor.responseTime != null && (
              <span>{monitor.responseTime}ms</span>
            )}
            {monitor.responseTime != null && monitor.uptime != null && (
              <span>·</span>
            )}
            {monitor.uptime != null ? (
              <span>{monitor.uptime.toFixed(2)}% uptime</span>
            ) : (
              <span>Insufficient data</span>
            )}
          </div>
          <StatusDot className={config.dotClass} pulse={monitor.status === "DOWN"} />
        </div>
      </div>

      {monitor.dailyUptime && monitor.dailyUptime.length > 0 && (
        <UptimeBars data={monitor.dailyUptime} />
      )}
    </div>
  );
}
