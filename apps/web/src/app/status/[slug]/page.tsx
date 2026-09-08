"use client";

import React from "react";
import { OverallStatus } from "@app/features/status/types/public-status";
import { usePublicStatus } from "@app/features/status/hooks/use-public-status";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import { SystemStatusHero } from "@app/features/status/components/system-status-hero";
import { ServiceMonitorCard } from "@app/features/status/components/service-monitor-card";
import { IncidentTimeline } from "@app/features/status/components/incident-timeline";

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

  // Use backend-provided aggregate uptime
  const overallUptime = data.aggregateUptime;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with branding */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {data.statusPage.logo ? (
              <img
                src={data.statusPage.logo}
                alt={`${data.statusPage.name} logo`}
                className="h-8 w-8 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-muted/20">
                <span className="text-xs font-semibold text-foreground">
                  {data.statusPage.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-sm font-medium text-foreground">
                {data.statusPage.name}
              </h1>
              {data.statusPage.description && (
                <p className="text-xs text-muted-foreground">
                  {data.statusPage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        {/* System status hero */}
        <SystemStatusHero status={data.status} overallUptime={overallUptime} monitors={data.monitors} />

        {/* Services section */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</h2>
          <div className="flex flex-col">
            {data.monitors.map((monitor) => (
              <ServiceMonitorCard key={monitor.name} monitor={monitor} />
            ))}
          </div>
        </section>

        {/* Incident timeline */}
        <section className="mt-16">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Incident History
          </h2>
          <IncidentTimeline incidents={data.incidents} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-3xl px-6 text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://operatio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:underline"
            >
              Operatio
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
