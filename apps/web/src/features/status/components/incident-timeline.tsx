import { PublicIncident } from "../types/public-status";
import { formatDuration } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { format } from "date-fns";

// Note: Backend Incident model currently lacks a public-facing title field.
// When adding that field, update this component to display incident titles
// instead of generic "Incident 1", "Incident 2" labels.

export function IncidentTimeline({
  incidents,
}: {
  incidents: PublicIncident[];
}) {
  const activeIncidents = incidents.filter((i) => i.status === "active");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  if (activeIncidents.length === 0 && resolvedIncidents.length === 0) {
    return (
      <div className="py-8 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <p className="text-foreground font-medium">No incidents reported</p>
          <p className="text-sm text-muted-foreground">
            All systems are operating normally.
          </p>
        </div>
      </div>
    );
  }

  // Group incidents by date for timeline
  const incidentsByDate = new Map<string, PublicIncident[]>();
  [...activeIncidents, ...resolvedIncidents].forEach((incident) => {
    const dateKey = format(new Date(incident.startedAt), "MMM d, yyyy");
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
        // Sort incidents by start time for proper chronological order
        const sortedDayIncidents = [...dayIncidents].sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
        );

        return (
          <div key={date} className="relative py-6 border-b border-border/40 last:border-0">
            {/* Date marker */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {date}
              </span>
              <div
                className={`h-2 w-2 rounded-full ${hasActive ? "bg-destructive" : "bg-status-operational"}`}
              />
            </div>

            {/* Incidents for this date */}
            <div className="space-y-4">
              {sortedDayIncidents.map((incident) => {
                const isActive = incident.status === "active";
                const shortId = incident.id.slice(0, 8);

                return (
                  <div key={incident.id} className="relative">
                    {/* Incident content */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground text-sm">
                            Incident #{shortId}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-destructive/10 text-destructive"
                                : "bg-status-operational/10 text-status-operational"
                            }`}
                          >
                            {isActive ? "Active" : "Resolved"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>
                          {format(new Date(incident.startedAt), "HH:mm")}
                        </span>
                        {incident.resolvedAt && (
                          <>
                            <span>→</span>
                            <span>
                              {format(new Date(incident.resolvedAt), "HH:mm")}
                            </span>
                          </>
                        )}
                        {incident.duration && (
                          <>
                            <span>·</span>
                            <span>
                              {formatDuration(incident.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
