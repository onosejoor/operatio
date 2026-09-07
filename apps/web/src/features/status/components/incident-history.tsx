import { PublicIncident } from "../types/public-status";
import { IncidentCard } from "./incident-card";

export function IncidentHistory({ incidents }: { incidents: PublicIncident[] }) {
  const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved");

  if (resolvedIncidents.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Past incidents
      </h2>
      <div className="flex flex-col gap-3">
        {resolvedIncidents.slice(0, 10).map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </section>
  );
}
