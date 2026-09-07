import { MetricsResponse } from "../types/public-status";
import { Gauge, Activity, AlertCircle, Timer } from "lucide-react";

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: MetricsResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricTile
        icon={Gauge}
        label="Avg latency"
        value={metrics.averageLatency != null ? `${metrics.averageLatency}ms` : "—"}
      />
      <MetricTile
        icon={Activity}
        label="Success rate"
        value={
          metrics.successRate != null ? `${metrics.successRate.toFixed(2)}%` : "—"
        }
      />
      <MetricTile
        icon={AlertCircle}
        label="Active incidents"
        value={metrics.activeIncidents?.toString() ?? "0"}
      />
      <MetricTile
        icon={Timer}
        label="Avg incident duration"
        value={
          metrics.averageIncidentDuration != null
            ? `${metrics.averageIncidentDuration}m`
            : "—"
        }
      />
    </div>
  );
}
