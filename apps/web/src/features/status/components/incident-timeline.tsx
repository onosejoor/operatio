import { PublicIncident } from "../types/public-status";
import { formatDuration } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { format } from "date-fns";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";

export function IncidentTimeline({
  incidents,
}: {
  incidents: PublicIncident[];
}) {
  const activeIncidents = incidents.filter((i) => i.status === "active");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  if (activeIncidents.length === 0 && resolvedIncidents.length === 0) {
    return (
      <Card className="rounded-xl border border-border/40 bg-card/40 p-8 text-center shadow-2xs">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-status-operational/15 text-status-operational">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No Incidents Reported
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          All probe checks and monitored endpoints have maintained nominal operational uptime across the reporting window.
        </p>
      </Card>
    );
  }

  // Group incidents by date for timeline
  const incidentsByDate = new Map<string, PublicIncident[]>();
  [...activeIncidents, ...resolvedIncidents].forEach((incident) => {
    const dateKey = format(new Date(incident.startedAt), "MMMM d, yyyy");
    if (!incidentsByDate.has(dateKey)) {
      incidentsByDate.set(dateKey, []);
    }
    incidentsByDate.get(dateKey)!.push(incident);
  });

  // Sort dates in descending order (newest first)
  const sortedDates = Array.from(incidentsByDate.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayIncidents = incidentsByDate.get(date)!;
        const hasActive = dayIncidents.some((i) => i.status === "active");
        const sortedDayIncidents = [...dayIncidents].sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );

        return (
          <Card
            key={date}
            className="rounded-xl border border-border/40 bg-card/60 p-5 sm:p-6 transition-all shadow-2xs"
          >
            {/* Date marker */}
            <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                  {date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {hasActive ? (
                  <span className="flex items-center gap-1.5 text-status-outage font-mono text-[11px]">
                    <StatusDot className="bg-status-outage" pulse />
                    Active Outage
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-operational" />
                    Resolved
                  </span>
                )}
              </div>
            </div>

            {/* Incidents for this date */}
            <div className="space-y-4">
              {sortedDayIncidents.map((incident) => {
                const isActive = incident.status === "active";
                const shortId = incident.id.slice(0, 8);

                return (
                  <div
                    key={incident.id}
                    className={`rounded-lg border p-4 transition-all ${
                      isActive
                        ? "border-status-outage/40 bg-status-outage/3"
                        : "border-border/40 bg-background/50"
                    }`}
                  >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          INC-{shortId}
                        </span>
                        <Badge
                          variant={isActive ? "outage" : "operational"}
                          className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                        >
                          {isActive ? "Active Investigation" : "Resolved"}
                        </Badge>
                      </div>

                      {/* Timestamps and Duration */}
                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{format(new Date(incident.startedAt), "HH:mm")}</span>
                        {incident.resolvedAt && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                            <span>{format(new Date(incident.resolvedAt), "HH:mm")}</span>
                          </>
                        )}
                        {incident.duration && (
                          <span className="ml-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-medium">
                            {formatDuration(incident.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {isActive
                        ? "Engineering teams have detected probe anomalies on this resource. Automated diagnostic and routing checks are executing."
                        : "Root cause identified and mitigated. Latency and error rates have stabilized to nominal baselines."}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
