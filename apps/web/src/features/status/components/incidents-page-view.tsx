"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicStatus,
  statusKeys,
} from "@app/features/status/hooks/use-public-status";
import type { PublicStatusResponse } from "@app/features/status/types/public-status";
import { PublicStatusHeader } from "@app/features/status/components/public-status-header";
import {
  ActiveIncidents,
  IncidentHistory,
} from "@app/features/status/components/incident-timeline";
import { PublicStatusFooter } from "@app/features/status/components/public-status-footer";

interface IncidentsPageViewProps {
  slug: string;
  initialData: PublicStatusResponse;
}

export function IncidentsPageView({
  slug,
  initialData,
}: IncidentsPageViewProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { data = initialData } = usePublicStatus(slug, initialData);

  const handleRefresh = useCallback(async () => {
    if (!slug || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: statusKeys.public(slug),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [slug, isRefreshing, queryClient]);

  const activeIncidents = data.incidents.filter((i) => i.status === "active");
  const resolvedIncidents = data.incidents.filter(
    (i) => i.status === "resolved",
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/20">
      {/* Header */}
      <PublicStatusHeader
        statusPage={data.statusPage}
        overallStatus={data.status}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">

        {/* Page Title */}
        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incident history and updates for {data.statusPage.name}
          </p>
        </div>

        {/* Active Incidents Section */}
        {activeIncidents.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                  Active incidents
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {activeIncidents.length}{" "}
                  {activeIncidents.length === 1 ? "incident" : "incidents"}
                </span>
              </div>
            </div>
            <ActiveIncidents incidents={data.incidents} />
          </section>
        )}

        {/* Historical Incidents Section */}
        <section>
          {activeIncidents.length === 0 && resolvedIncidents.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/40 p-8 text-center">
              <h2 className="text-sm font-semibold text-foreground mb-2">
                No incidents
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Everything has been running smoothly. There are no incidents to
                report.
              </p>
            </div>
          ) : (
            <>
              {activeIncidents.length === 0 && (
                <div className="mb-6 rounded-xl border border-border/40 bg-card/30 px-5 py-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>No active incidents</span>
                  </div>
                </div>
              )}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                    Incident history
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {resolvedIncidents.length}{" "}
                    {resolvedIncidents.length === 1 ? "incident" : "incidents"}
                  </span>
                </div>
              </div>
              <IncidentHistory incidents={data.incidents} />
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <PublicStatusFooter statusPageName={data.statusPage.name} />
    </div>
  );
}
