import { OverallStatus } from "../types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { Activity } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";

export function SystemStatusHero({
  status,
  overallUptime,
  lastCheckedTime,
}: {
  status: OverallStatus;
  overallUptime?: number | null;
  lastCheckedTime?: string;
}) {
  const config = overallStatusConfig[status];

  let headline = "All systems operational";
  let description = "Everything is operating normally.";

  if (status === OverallStatus.MAJOR_OUTAGE) {
    headline = "Service disruption";
    description = "One or more services are currently unavailable.";
  } else if (status === OverallStatus.DEGRADED) {
    headline = "Some systems are experiencing issues";
    description =
      "Some services are currently operating below normal performance.";
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
      {/* Top Status Bar with Timestamp */}
      {lastCheckedTime && (
        <div className="mb-4 flex items-center justify-end text-[11px] font-mono text-muted-foreground">
          <span>Updated {lastCheckedTime}</span>
        </div>
      )}

      {/* Main Operational Hero Card */}
      <Card
        className={`relative overflow-hidden rounded-xl border p-6 sm:p-8 transition-all shadow-sm ${
          isHealthy
            ? "bg-status-operational/3"
            : isMajor
              ? "bg-status-outage/4"
              : "bg-status-degraded/4"
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
              {headline}
            </h1>

            {/* Descriptive Summary */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Right Metric: 90-Day Rolling Uptime (only when provided by backend) */}
          {overallUptime != null && (
            <div className="shrink-0 flex flex-col md:items-end justify-center rounded-lg border border-border/40 bg-background/60 p-4 backdrop-blur-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Activity className="h-3.5 w-3.5 text-foreground/70" />
                <span className="font-medium">90-Day Uptime</span>
              </div>
              <div className="font-mono text-3xl font-bold tracking-tight text-foreground">
                {overallUptime.toFixed(2)}%
              </div>
              <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Rolling 90-day window
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
