"use client";

import React from "react";
import {
  OverallStatus,
  PublicStatusResponse,
} from "@app/features/status/types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "@app/features/status/components/status-dot";
import { MonitorRow } from "@app/features/status/components/service-status-list";
import { MetricsGrid } from "@app/features/status/components/metrics-grid";
import { OverallStatusBanner } from "@app/features/status/components/overall-status-banner";
import { ActiveIncidents } from "@app/features/status/components/active-incidents";
import { IncidentHistory } from "@app/features/status/components/incident-history";
import { Separator } from "@app/features/status/components/separator";
import {
  usePublicStatus,
  usePublicStatusMetrics,
} from "@app/features/status/hooks/use-public-status";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";

interface StatusPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function StatusPage({ params }: StatusPageProps) {
  const [slug, setSlug] = React.useState<string>("");

  React.useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const { data, isLoading, isError } = usePublicStatus(slug);
  const { data: metrics } = usePublicStatusMetrics(slug);

  if (!slug || isLoading) {
    return <LoaderDisplay message="Loading Status" fullScreen />;
  }

  if (isError || !data) {
    return (
      <ErrorDisplay
        message="Status not found"
        url="/"
        urlLabel="Go back home"
        fullScreen
      />
    );
  }

  const overall = overallStatusConfig[data.status];
  const activeIncidents = data.incidents.filter((i) => i.status === "active");
  const resolvedIncidents = data.incidents.filter(
    (i) => i.status === "resolved",
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {data.statusPage.logo ? (
              <img
                src={data.statusPage.logo}
                alt=""
                className="h-6 w-6 rounded"
              />
            ) : (
              <div className="h-6 w-6 rounded bg-primary" />
            )}
            <span className="font-semibold">{data.statusPage.name}</span>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1 sm:flex">
            <StatusDot
              className={overall.dotClass}
              pulse={data.status !== OverallStatus.OPERATIONAL}
            />
            <span className="text-xs">{overall.label}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {data.statusPage.description && (
          <p className="mb-6 text-sm text-muted-foreground">
            {data.statusPage.description}
          </p>
        )}

        {/* Overall status banner */}
        <OverallStatusBanner status={data.status} />

        {/* Active incidents, if any */}
        <ActiveIncidents incidents={data.incidents} />

        <Separator className="my-8" />

        {/* Metrics */}
        {metrics && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Overview
            </h2>
            <MetricsGrid metrics={metrics} />
          </section>
        )}

        <Separator className="my-8" />

        {/* Monitors */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Services
          </h2>
          <div className="flex flex-col gap-3">
            {data.monitors.map((monitor) => (
              <MonitorRow key={monitor.name} monitor={monitor} />
            ))}
          </div>
        </section>

        {/* Resolved incidents */}
        <IncidentHistory incidents={data.incidents} />
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-muted-foreground">
          Powered by {data.statusPage.name}
        </div>
      </footer>
    </div>
  );
}
