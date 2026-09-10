import {
  PublicIncident,
  PublicIncidentEvent,
  IncidentLifecycleStatus,
} from "../types/public-status";
import { formatDuration } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Search,
  Eye,
  Activity,
} from "lucide-react";
import { Card } from "@operatio/ui/components/ui/card";
import { Badge } from "@operatio/ui/components/ui/badge";
import { cn } from "@operatio/ui/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function severityVariant(severity?: string) {
  switch (severity) {
    case "CRITICAL":
      return "outage" as const;
    case "MAJOR":
      return "degraded" as const;
    case "MINOR":
      return "outline" as const;
    default:
      return "degraded" as const;
  }
}

function severityLabel(severity?: string) {
  if (!severity) return null;
  return severity.charAt(0) + severity.slice(1).toLowerCase(); // "Major"
}

function lifecycleLabel(status?: IncidentLifecycleStatus | string) {
  switch (status) {
    case "INVESTIGATING":
      return "Investigating";
    case "IDENTIFIED":
      return "Identified";
    case "MONITORING":
      return "Monitoring";
    case "RESOLVED":
      return "Resolved";
    default:
      return "Investigating";
  }
}

function lifecycleIcon(status?: string) {
  switch (status) {
    case "IDENTIFIED":
      return <Eye className="h-3 w-3" />;
    case "MONITORING":
      return <Activity className="h-3 w-3" />;
    case "RESOLVED":
      return <CheckCircle2 className="h-3 w-3" />;
    default:
      return <Search className="h-3 w-3" />;
  }
}

function eventDotClass(status?: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-status-operational";
    case "IDENTIFIED":
      return "bg-status-degraded";
    case "MONITORING":
      return "bg-blue-400";
    default:
      return "bg-status-outage";
  }
}

// ─── Event Log ───────────────────────────────────────────────────────────────

function IncidentEventLog({ events }: { events: PublicIncidentEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border/30 pt-4 space-y-3">
      {events.map((event, i) => {
        const ts = new Date(event.createdAt);
        return (
          <div key={i} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  eventDotClass(event.status),
                )}
              />
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-border/30 min-h-[12px]" />
              )}
            </div>

            {/* Event content */}
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {event.status && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    {lifecycleLabel(event.status)}
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {format(ts, "HH:mm")} UTC · {format(ts, "MMM d")}
                </span>
              </div>
              {event.message && (
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {event.message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Active Incidents ─────────────────────────────────────────────────────────

export function ActiveIncidents({
  incidents,
}: {
  incidents: PublicIncident[];
}) {
  const active = incidents.filter((i) => i.status === "active");

  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/30 px-5 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-status-operational" />
          <span>No active incidents</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map((incident) => {
        const shortId = incident.id.slice(-6).toUpperCase();
        const startedDate = new Date(incident.startedAt);
        const currentStatus = incident.incidentStatus ?? "INVESTIGATING";
        const sev = severityLabel(incident.severity);

        return (
          <Card
            key={incident.id}
            className="rounded-xl border border-status-outage/40 bg-status-outage/4 p-5 sm:p-6 transition-all shadow-2xs"
          >
            {/* Header row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatusDot className="bg-status-outage" pulse />
                <span className="font-mono text-xs font-semibold text-foreground">
                  Incident #{shortId}
                </span>

                {/* Lifecycle status — real data */}
                <Badge
                  variant="outage"
                  className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1"
                >
                  {lifecycleIcon(currentStatus)}
                  {lifecycleLabel(currentStatus)}
                </Badge>

                {/* Severity badge — real data */}
                {sev && (
                  <Badge
                    variant={severityVariant(incident.severity)}
                    className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                  >
                    {sev}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-status-outage" />
                <span>
                  Started {format(startedDate, "HH:mm")} UTC (
                  {format(startedDate, "MMM d")})
                </span>
              </div>
            </div>

            {/* Public message — real data */}
            {incident.publicMessage && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                {incident.publicMessage}
              </p>
            )}

            {/* Event log */}
            <IncidentEventLog events={incident.events ?? []} />
          </Card>
        );
      })}
    </div>
  );
}

// ─── Incident History ─────────────────────────────────────────────────────────

export function IncidentHistory({
  incidents,
}: {
  incidents: PublicIncident[];
}) {
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  if (resolvedIncidents.length === 0) {
    return (
      <Card className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-xs font-mono text-muted-foreground">
        No incidents recorded.
      </Card>
    );
  }

  // Group resolved incidents by date
  const incidentsByDate = new Map<string, PublicIncident[]>();
  resolvedIncidents.forEach((incident) => {
    const dateKey = format(new Date(incident.startedAt), "MMMM d, yyyy");
    if (!incidentsByDate.has(dateKey)) {
      incidentsByDate.set(dateKey, []);
    }
    incidentsByDate.get(dateKey)!.push(incident);
  });

  // Sort dates descending
  const sortedDates = Array.from(incidentsByDate.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayIncidents = incidentsByDate.get(date)!;
        const sortedDayIncidents = [...dayIncidents].sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );

        return (
          <Card
            key={date}
            className="rounded-xl border border-border/40 bg-card/60 p-5 sm:p-6 transition-all shadow-2xs"
          >
            {/* Date Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                {date}
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-operational" />
                <span>All resolved</span>
              </div>
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
              {sortedDayIncidents.map((incident) => {
                const shortId = incident.id.slice(-6).toUpperCase();
                const startDate = new Date(incident.startedAt);
                const resolvedDate = incident.resolvedAt
                  ? new Date(incident.resolvedAt)
                  : null;
                const sev = severityLabel(incident.severity);

                // Use durationMs if available (stored), fall back to derived seconds
                const durationDisplay =
                  incident.durationMs != null
                    ? formatDuration(Math.floor(incident.durationMs / 1000))
                    : incident.duration != null
                      ? formatDuration(incident.duration)
                      : null;

                return (
                  <div
                    key={incident.id}
                    className="rounded-lg border border-border/40 bg-background/50 p-4 transition-all"
                  >
                    {/* Incident header */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          Incident #{shortId}
                        </span>
                        <Badge
                          variant="operational"
                          className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                        >
                          Resolved
                        </Badge>
                        {sev && (
                          <Badge
                            variant={severityVariant(incident.severity)}
                            className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                          >
                            {sev}
                          </Badge>
                        )}
                      </div>

                      {/* Timestamps & Duration */}
                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{format(startDate, "HH:mm")}</span>
                        {resolvedDate && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                            <span>{format(resolvedDate, "HH:mm")}</span>
                          </>
                        )}
                        {durationDisplay && (
                          <span className="ml-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-medium">
                            {durationDisplay}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Public message */}
                    {incident.publicMessage && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {incident.publicMessage}
                      </p>
                    )}

                    {/* Event log */}
                    <IncidentEventLog events={incident.events ?? []} />
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

// ─── Backward compat wrapper ──────────────────────────────────────────────────

export function IncidentTimeline({
  incidents,
}: {
  incidents: PublicIncident[];
}) {
  return (
    <div className="space-y-6">
      <ActiveIncidents incidents={incidents} />
      <IncidentHistory incidents={incidents} />
    </div>
  );
}
