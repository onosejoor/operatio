import {
  MonitorPerformanceStatus,
  OverallStatus,
  PublicMonitor,
} from "../types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { Activity, Radio } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";

export function SystemStatusHero({
  status,
  overallUptime,
  monitors = [],
  lastCheckedTime,
}: {
  status: OverallStatus;
  overallUptime?: number | null;
  monitors?: PublicMonitor[];
  lastCheckedTime?: string;
}) {
  const config = overallStatusConfig[status];

  const affectedMonitors = monitors.filter(
    (m) => m.status !== MonitorPerformanceStatus.UP,
  );
  const affectedNames =
    affectedMonitors.length > 3
      ? `${affectedMonitors
          .slice(0, 2)
          .map((m) => m.name)
          .join(", ")} and ${affectedMonitors.length - 2} others`
      : affectedMonitors.map((m) => m.name).join(", ");

  let description =
    "All core systems and probes are operational without active disruptions.";
  if (status === OverallStatus.MAJOR_OUTAGE) {
    description =
      affectedMonitors.length > 0
        ? `Critical outage affecting ${affectedNames}. Operational teams are actively mitigating.`
        : "Multiple core infrastructure services are currently unreachable. We are investigating.";
  } else if (status === OverallStatus.DEGRADED) {
    description =
      affectedMonitors.length > 0
        ? `Elevated latency or degradation affecting ${affectedNames}. Investigation in progress.`
        : "Some subsystem monitors are reporting performance anomalies. We are investigating.";
  }

  const isHealthy = status === OverallStatus.OPERATIONAL;
  const isMajor = status === OverallStatus.MAJOR_OUTAGE;

  const badgeVariant = isHealthy
    ? "operational"
    : isMajor
      ? "outage"
      : "degraded";

  return (
    <div className="pt-8 pb-10 border-b border-border/40">
      {/* Top Technical Metadata Row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-operational" />
          <span className="font-semibold text-foreground">Global Cluster</span>
          <span className="text-border">/</span>
          <span>Edge Monitored</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Radio className="h-3 w-3 text-status-operational animate-pulse" />
            <span>Live Telemetry</span>
          </div>
          {lastCheckedTime && (
            <>
              <span className="text-border">·</span>
              <span>Updated {lastCheckedTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Operational Hero Card / Banner */}
      <Card
        className={`relative overflow-hidden rounded-xl border p-6 sm:p-8 transition-all shadow-sm ${
          isHealthy
            ? "border-status-operational/25 bg-status-operational/3"
            : isMajor
              ? "border-status-outage/30 bg-status-outage/4"
              : "border-status-degraded/30 bg-status-degraded/4"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            {/* Status Badge Indicator */}
            <div className="inline-flex items-center gap-2">
              <Badge
                variant={badgeVariant}
                className="gap-1.5 px-3 py-1 text-xs font-semibold"
              >
                <StatusDot className={config.dotClass} pulse={!isHealthy} />
                <span>{config.label}</span>
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {isHealthy
                ? "All Core Systems Operational"
                : isMajor
                  ? "Major Operational Outage"
                  : "Partial Subsystem Degradation"}
            </h1>

            {/* Descriptive Summary */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Right Metric: 90-Day Rolling Reliability */}
          <div className="shrink-0 flex flex-col md:items-end justify-center rounded-lg border border-border/40 bg-background/60 p-4 backdrop-blur-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Activity className="h-3.5 w-3.5 text-foreground/70" />
              <span className="font-medium">90-Day Reliability</span>
            </div>
            <div className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {overallUptime != null ? `${overallUptime.toFixed(2)}%` : "—"}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Across all configured probes
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
