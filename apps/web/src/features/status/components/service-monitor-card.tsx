import { PublicMonitor } from "../types/public-status";
import { monitorStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";
import { Gauge, CheckCircle2 } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";

export function ServiceMonitorCard({ monitor }: { monitor: PublicMonitor }) {
  const config = monitorStatusConfig[monitor.status];
  const isUp = monitor.status === "UP";

  const badgeVariant = isUp
    ? "operational"
    : monitor.status === "DOWN"
      ? "outage"
      : "degraded";

  return (
    <Card className="group rounded-xl border border-border/40 bg-card/60 p-5 transition-all hover:border-border/80 hover:bg-card shadow-2xs">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Monitor Name, Dot & Badge */}
        <div className="flex items-center gap-3">
          <StatusDot className={config.dotClass} pulse={!isUp} />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {monitor.name}
          </h3>
          <Badge
            variant={badgeVariant}
            className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
          >
            {config.label}
          </Badge>
        </div>

        {/* Right: Telemetry metrics */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          {monitor.responseTime != null && (
            <div className="flex items-center gap-1.5" title="Average Response Time">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span className="text-foreground font-medium">
                {monitor.responseTime}ms
              </span>
            </div>
          )}

          {monitor.responseTime != null && monitor.uptime != null && (
            <span className="text-border">·</span>
          )}

          {monitor.uptime != null ? (
            <div className="flex items-center gap-1.5" title="90-day Availability">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-operational" />
              <span className="text-foreground font-semibold">
                {monitor.uptime.toFixed(2)}%
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground/60">No telemetry data</span>
          )}
        </div>
      </div>

      {/* 90-day uptime bars */}
      {monitor.dailyUptime && monitor.dailyUptime.length > 0 ? (
        <div className="pt-2">
          <UptimeBars data={monitor.dailyUptime} />
        </div>
      ) : (
        <div className="py-2 text-xs font-mono text-muted-foreground/60">
          Uptime telemetry recording in progress.
        </div>
      )}
    </Card>
  );
}
