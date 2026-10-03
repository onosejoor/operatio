"use client";

import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import { Activity, AlertTriangle, CheckCircle2, Siren } from "lucide-react";
import { useOrganizationIncidents } from "@app/features/monitors/hooks/dashboard-queries";
import {
  ActiveIncidents,
  IncidentHistory,
} from "@app/features/status/components/incident-timeline";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";

export function IncidentsView({ orgSlug }: { orgSlug: string }) {
  const organizations = useOrganizations();
  const organization = organizations.data?.find((item) => item.slug === orgSlug);
  const incidentsQuery = useOrganizationIncidents(organization?.id);

  if (organizations.isPending || (organization && incidentsQuery.isPending)) {
    return <LoaderDisplay message="Loading incidents" />;
  }

  if (organizations.isError) {
    return (
      <ErrorDisplay
        title="Unable to load your organizations"
        message={organizations.error.message}
        onRetry={() => void organizations.refetch()}
      />
    );
  }

  if (!organization) {
    return (
      <ErrorDisplay
        title="Organization not found"
        message="This organization is not available to your account."
      />
    );
  }

  if (incidentsQuery.isError) {
    return (
      <ErrorDisplay
        title="Unable to load incidents"
        message={incidentsQuery.error.message}
        onRetry={() => void incidentsQuery.refetch()}
      />
    );
  }

  const incidents = incidentsQuery.data ?? [];
  const activeIncidents = incidents.filter((incident) => incident.status === "active");
  const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved");
  const criticalIncidents = activeIncidents.filter(
    (incident) => incident.severity === "CRITICAL",
  );
  const stats = [
    {
      label: "Total incidents",
      value: incidents.length,
      hint: "Recorded for this organization",
      icon: Activity,
    },
    {
      label: "Active",
      value: activeIncidents.length,
      hint: "Currently unresolved",
      icon: AlertTriangle,
    },
    {
      label: "Resolved",
      value: resolvedIncidents.length,
      hint: "Closed incidents",
      icon: CheckCircle2,
    },
    {
      label: "Critical active",
      value: criticalIncidents.length,
      hint: "Needs immediate attention",
      icon: Siren,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Incidents</h2>
        <p className="text-sm text-muted-foreground">
          Incident updates and history for {organization.name}.
        </p>
      </header>

      <section
        aria-label="Incident summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {label}
                <Icon className="size-4" aria-hidden="true" />
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {value.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {hint}
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="active-incidents-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="active-incidents-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Active incidents
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {activeIncidents.length}
          </span>
        </div>
        <ActiveIncidents incidents={activeIncidents} />
      </section>

      <section aria-labelledby="incident-history-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="incident-history-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Incident history
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {resolvedIncidents.length}
          </span>
        </div>
        {resolvedIncidents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No incident history</CardTitle>
              <CardDescription>
                Resolved incidents will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ) : (
          <IncidentHistory incidents={resolvedIncidents} />
        )}
      </section>
    </main>
  );
}
