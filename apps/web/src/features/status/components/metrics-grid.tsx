import { MetricsResponse } from "../types/public-status";
import { Gauge, CheckCircle2, AlertOctagon, Timer } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";

interface MetricCardProps {
  icon: typeof Gauge;
  label: string;
  value: string;
  subtext: string;
  statusBadge?: string;
}

function TelemetryCard({
  icon: Icon,
  label,
  value,
  subtext,
  statusBadge,
}: MetricCardProps) {
  return (
    <Card className="group relative rounded-xl border border-border/50 bg-card p-4 text-card-foreground transition-all hover:border-border/90 hover:bg-card/80 shadow-2xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>{label}</span>
        </div>
        {statusBadge && (
          <Badge
            variant="outline"
            className="font-mono text-[9px] px-1 py-0 text-muted-foreground/80 border-border/40 font-normal"
          >
            {statusBadge}
          </Badge>
        )}
      </div>
      <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
        {subtext}
      </p>
    </Card>
  );
}

export function MetricsGrid({ metrics }: { metrics?: MetricsResponse | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border/40 bg-muted/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const avgLatencyStr =
    metrics.averageLatency != null ? `${metrics.averageLatency}ms` : "—";
  const successRateStr =
    metrics.successRate != null ? `${metrics.successRate.toFixed(2)}%` : "—";
  const activeIncidentsStr =
    metrics.activeIncidents != null ? metrics.activeIncidents.toString() : "0";
  const avgDurationStr =
    metrics.averageIncidentDuration != null
      ? `${Math.round(metrics.averageIncidentDuration / 60)}m`
      : "—";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      <TelemetryCard
        icon={Gauge}
        label="Check Response Time"
        value={avgLatencyStr}
        subtext="Rolling 1h probe average"
        statusBadge="P95 / HTTP"
      />
      <TelemetryCard
        icon={CheckCircle2}
        label="Execution Success"
        value={successRateStr}
        subtext="Target availability 99.9%"
        statusBadge="HEALTHY"
      />
      <TelemetryCard
        icon={AlertOctagon}
        label="Active Incidents"
        value={activeIncidentsStr}
        subtext="Currently impacting services"
        statusBadge={Number(activeIncidentsStr) > 0 ? "DEGRADED" : "NOMINAL"}
      />
      <TelemetryCard
        icon={Timer}
        label="Avg Resolution"
        value={avgDurationStr}
        subtext="Mean duration for incidents"
        statusBadge="HISTORIC"
      />
    </div>
  );
}
