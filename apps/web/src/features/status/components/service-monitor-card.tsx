"use client";

import { PublicMonitor } from "../types/public-status";
import { monitorStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";
import { Gauge, CheckCircle2, ChevronRight } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";
import { Button } from "@operatio/ui/components/ui/button";

export function ServiceMonitorCard({
  monitor,
  onViewDetails,
}: {
  monitor: PublicMonitor;
  onViewDetails?: (monitor: PublicMonitor) => void;
}) {
  const config = monitorStatusConfig[monitor.status];
  const isUp = monitor.status === "UP";
  const isDown = monitor.status === "DOWN";
  const isSlow = monitor.status === "SLOW";

  const badgeVariant = isUp
    ? ("operational" as const)
    : isDown
      ? ("outage" as const)
      : isSlow
        ? ("degraded" as const)
        : ("pending" as const);

  // Authoritative human-readable explanation of current state
  let statusMessage: string | null = null;
  if (isDown) {
    statusMessage = "Service currently unavailable";
  } else if (isSlow) {
    statusMessage = "Response time above normal";
  }

  const hasMetrics = monitor.responseTime != null || monitor.uptime != null;

  return (
    <Card
      className={`group rounded-xl border p-5 sm:p-6 transition-all shadow-2xs ${
        isDown
          ? "bg-status-outage/4"
          : isSlow
            ? "bg-status-degraded/4"
            : "bg-card/6 0hover:bg-card"
      }`}
    >
      {/* Top Header Row: Service Name & Status Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <StatusDot className={config.dotClass} pulse={!isUp} />
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {monitor.name}
          </h3>
        </div>

        <Badge
          variant={badgeVariant}
          className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 self-start sm:self-auto flex items-center gap-1.5"
        >
          <StatusDot className={config.dotClass} pulse={!isUp} />
          <span>{config.label}</span>
        </Badge>
      </div>

      {/* Human-readable status message for DOWN or SLOW */}
      {statusMessage && (
        <div className="mt-2 text-xs font-medium font-mono text-muted-foreground flex items-center gap-1.5">
          <span
            className={isDown ? "text-status-outage" : "text-status-degraded"}
          >
            {statusMessage}
          </span>
        </div>
      )}

      {/* Performance Metrics Row */}
      {hasMetrics && (
        <div className="mt-4 flex items-center gap-6 text-xs font-mono text-muted-foreground border-t border-border/30 pt-3">
          {monitor.uptime != null && (
            <div
              className="flex items-center gap-1.5"
              title="90-day Availability"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-status-operational" />
              <span className="text-foreground font-semibold">
                {monitor.uptime.toFixed(2)}%
              </span>
              <span className="text-muted-foreground text-[11px]">uptime</span>
            </div>
          )}

          {monitor.responseTime != null && (
            <div
              className="flex items-center gap-1.5"
              title="Average Response Time"
            >
              <Gauge className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span className="text-foreground font-medium">
                {monitor.responseTime}ms
              </span>
            </div>
          )}
        </div>
      )}

      {/* 90-day uptime bars */}
      {monitor.dailyUptime && monitor.dailyUptime.length > 0 ? (
        <div className="mt-4 pt-1">
          <UptimeBars data={monitor.dailyUptime} />
        </div>
      ) : (
        <div className="mt-3 text-xs font-mono text-muted-foreground/60">
          Uptime history not available.
        </div>
      )}

      {/* Details Action Affordance */}
      {onViewDetails && (
        <div className="mt-4 flex items-center justify-end border-t border-border/20 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(monitor)}
            className="h-7 gap-1 px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            <span>Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}
