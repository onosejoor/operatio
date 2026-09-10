"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicStatus,
  statusKeys,
} from "@app/features/status/hooks/use-public-status";
import type { PublicStatusResponse } from "@app/features/status/types/public-status";
import { PublicStatusHeader } from "@app/features/status/components/public-status-header";
import { SystemStatusHero } from "@app/features/status/components/system-status-hero";
import { ServiceMonitorCard } from "@app/features/status/components/service-monitor-card";
import {
  ActiveIncidents,
  IncidentHistory,
} from "@app/features/status/components/incident-timeline";
import { PublicStatusFooter } from "@app/features/status/components/public-status-footer";
import { SubscribeDialog } from "@app/features/status/components/subscribe-dialog";
import { Server, History, AlertCircle } from "lucide-react";

interface StatusPageViewProps {
  slug: string;
  initialData: PublicStatusResponse;
}

export function StatusPageView({
  slug,
  initialData,
}: StatusPageViewProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("just now");

  const queryClient = useQueryClient();

  const { data = initialData } = usePublicStatus(slug, initialData);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (!slug || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: statusKeys.public(slug) });
      setLastCheckedTime("just now");
    } finally {
      setIsRefreshing(false);
    }
  }, [slug, isRefreshing, queryClient]);

  const activeIncidents = data.incidents.filter((i) => i.status === "active");
  const overallUptime = data.aggregateUptime;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/20">
      {/* Header */}
      <PublicStatusHeader
        statusPage={data.statusPage}
        overallStatus={data.status}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        {/* Overall Status Hero */}
        <SystemStatusHero
          status={data.status}
          overallUptime={overallUptime}
          lastCheckedTime={lastCheckedTime}
        />

        {/* Services Section */}
        <section id="services" className="pt-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Services
              </h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {data.monitors.length}{" "}
              {data.monitors.length === 1 ? "service" : "services"}
            </span>
          </div>

          <div className="space-y-3">
            {data.monitors.length > 0 ? (
              data.monitors.map((monitor) => (
                <ServiceMonitorCard key={monitor.name} monitor={monitor} />
              ))
            ) : (
              <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-xs font-mono text-muted-foreground">
                No services configured for this status page.
              </div>
            )}
          </div>
        </section>

        {/* Active Incidents Section (Prominently shown when active incidents exist) */}
        {activeIncidents.length > 0 && (
          <section id="active-incidents" className="pt-12">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-status-outage" />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-status-outage">
                  Active Incidents
                </h2>
              </div>
              <span className="font-mono text-[11px] text-status-outage">
                {activeIncidents.length} active
              </span>
            </div>

            <ActiveIncidents incidents={data.incidents} />
          </section>
        )}

        {/* Incident History Section */}
        <section id="incidents" className="pt-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Incident History
              </h2>
            </div>
          </div>

          <IncidentHistory incidents={data.incidents} />
        </section>
      </main>

      {/* Footer */}
      <PublicStatusFooter statusPageName={data.statusPage.name} />

      {/* Subscribe Dialog */}
      <SubscribeDialog
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        statusPageName={data.statusPage.name}
      />
    </div>
  );
}
