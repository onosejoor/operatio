"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicStatus,
  statusKeys,
} from "@app/features/status/hooks/use-public-status";
import type {
  PublicStatusResponse,
  PublicMonitor,
} from "@app/features/status/types/public-status";
import { PublicStatusHeader } from "@app/features/status/components/public-status-header";
import { SystemStatusHero } from "@app/features/status/components/system-status-hero";
import { ServiceMonitorCard } from "@app/features/status/components/service-monitor-card";
import { ServiceDetailsDialog } from "@app/features/status/components/service-details-dialog";
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

export function StatusPageView({ slug, initialData }: StatusPageViewProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
  const [selectedMonitor, setSelectedMonitor] = useState<PublicMonitor | null>(
    null,
  );
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("just now");

  const queryClient = useQueryClient();

  const { data = initialData } = usePublicStatus(slug, initialData);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (!slug || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: statusKeys.public(slug),
      });
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

        {/* Active Incident Banner — compact alert that scrolls to full incident list */}
        {activeIncidents.length > 0 && (
          <a
            href="#incidents"
            className="mt-8 flex items-center justify-between gap-3 rounded-lg  bg-status-outage/5 px-4 py-3 transition-colors hover:bg-status-outage/10 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-status-outage" />
              <span className="font-mono text-xs font-semibold text-status-outage">
                {activeIncidents.length === 1
                  ? "1 active incident affecting your services"
                  : `${activeIncidents.length} active incidents affecting your services`}
              </span>
            </div>
            <span className="font-mono text-[11px] text-status-outage/80 shrink-0 group-hover:underline">
              View incidents ↓
            </span>
          </a>
        )}

        {/* Services Section */}
        <section id="services" className="pt-10">
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
                <ServiceMonitorCard
                  key={monitor.name}
                  monitor={monitor}
                  onViewDetails={(m) => setSelectedMonitor(m)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-xs font-mono text-muted-foreground">
                No services configured for this status page.
              </div>
            )}
          </div>
        </section>

        {/* Incidents Section — active first, then history */}
        <section id="incidents" className="pt-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Incidents
              </h2>
            </div>
          </div>

          {/* Active incidents rendered first so the anchor scroll lands here */}
          {activeIncidents.length > 0 && (
            <div className="mb-8">
              <ActiveIncidents incidents={data.incidents} />
            </div>
          )}

          <IncidentHistory incidents={data.incidents} />
        </section>
      </main>

      {/* Footer */}
      <PublicStatusFooter statusPageName={data.statusPage.name} />

      {/* Progressive Disclosure Dialog: Service Details */}
      <ServiceDetailsDialog
        monitor={selectedMonitor}
        isOpen={Boolean(selectedMonitor)}
        onClose={() => setSelectedMonitor(null)}
      />

      {/* Subscribe Dialog */}
      <SubscribeDialog
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        statusPageName={data.statusPage.name}
      />
    </div>
  );
}
