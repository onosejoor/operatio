import {
  MonitorPerformanceStatus,
  OverallStatus,
  PublicMonitor,
} from "../types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";

export function SystemStatusHero({
  status,
  overallUptime,
  monitors = [],
}: {
  status: OverallStatus;
  overallUptime?: number | null;
  monitors?: PublicMonitor[];
}) {
  const config = overallStatusConfig[status];

  const affectedMonitors = monitors.filter(
    (m) => m.status !== MonitorPerformanceStatus.UP,
  );
  const affectedNames = affectedMonitors.map((m) => m.name).join(", ");

  let description = "Everything is running normally without disruption.";
  if (status === OverallStatus.MAJOR_OUTAGE) {
    description =
      affectedMonitors.length > 0
        ? `Major outage affecting ${affectedNames}. We are investigating.`
        : "Multiple services are currently unavailable. We are investigating.";
  } else if (status === OverallStatus.DEGRADED) {
    description =
      affectedMonitors.length > 0
        ? `Performance issues affecting ${affectedNames}. We are investigating.`
        : "Some services are currently degraded. We are investigating.";
  }

  return (
    <div className="py-8 border-b border-border/40">
      <div className="flex items-center gap-3 mb-4">
        <StatusDot
          className={config.dotClass}
          pulse={status === OverallStatus.MAJOR_OUTAGE}
        />
        <span
          className={`text-sm font-semibold tracking-wider ${config.textClass}`}
        >
          {config.label}
        </span>
      </div>

      <h1 className="mb-3 text-4xl tracking-tight font-semibold text-foreground">
        {status === OverallStatus.OPERATIONAL
          ? "All systems operational"
          : status === OverallStatus.MAJOR_OUTAGE
            ? "Major service disruption"
            : "Some systems experiencing issues"}
      </h1>

      <p className="text-lg text-muted-foreground mb-6">{description}</p>

      {overallUptime != null && (
        <p className="text-sm text-muted-foreground">
          Overall uptime (90 days):{" "}
          <span className="font-medium text-foreground">
            {overallUptime.toFixed(2)}%
          </span>
        </p>
      )}
      {overallUptime === null && (
        <p className="text-sm text-muted-foreground">
          Overall uptime (90 days):{" "}
          <span className="font-medium text-foreground">—</span>
        </p>
      )}
    </div>
  );
}
