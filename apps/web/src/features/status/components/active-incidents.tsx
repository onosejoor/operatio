import { PublicIncident } from "../types/public-status";
import { IncidentCard } from "./incident-card";

export function ActiveIncidents({ incidents }: { incidents: PublicIncident[] }) {
  const activeIncidents = incidents.filter((incident) => incident.status === "active");

  if (activeIncidents.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Active incidents
      </h2>
      <div className="flex flex-col gap-3">
        {activeIncidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </section>
  );
}
