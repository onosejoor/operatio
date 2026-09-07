import { PublicIncident } from "../types/public-status";
import { formatDuration } from "@app/lib/status";
import { Badge } from "@operatio/ui/components/ui/badge";
import { StatusDot } from "./status-dot";

export function IncidentCard({ incident }: { incident: PublicIncident }) {
  const isActive = incident.status === "active";

  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusDot
            className={isActive ? "bg-status-outage" : "bg-status-operational"}
            pulse={isActive}
          />
          <span className="font-medium">Incident #{incident.id.slice(0, 8)}</span>
        </div>
        <Badge variant={isActive ? "outage" : "operational"}>
          {isActive ? "Active" : "Resolved"}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Started {new Date(incident.startedAt).toLocaleString()}</span>
        {incident.resolvedAt && (
          <span>Resolved {new Date(incident.resolvedAt).toLocaleString()}</span>
        )}
        {incident.duration != null && (
          <span>Duration: {formatDuration(incident.duration)}</span>
        )}
      </div>
    </div>
  );
}
