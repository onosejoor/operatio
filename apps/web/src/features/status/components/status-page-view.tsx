"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicStatus,
  usePublicStatusMetrics,
  statusKeys,
} from "@app/features/status/hooks/use-public-status";
import type {
  PublicStatusResponse,
  MetricsResponse,
} from "@app/features/status/types/public-status";
import { PublicStatusHeader } from "@app/features/status/components/public-status-header";
import { SystemStatusHero } from "@app/features/status/components/system-status-hero";
import { MetricsGrid } from "@app/features/status/components/metrics-grid";
import { ServiceMonitorCard } from "@app/features/status/components/service-monitor-card";
import { IncidentTimeline } from "@app/features/status/components/incident-timeline";
import { PublicStatusFooter } from "@app/features/status/components/public-status-footer";
import { SubscribeDialog } from "@app/features/status/components/subscribe-dialog";
import { Server, Activity, History } from "lucide-react";

interface StatusPageViewProps {
  slug: string;
  initialData: PublicStatusResponse;
  initialMetrics?: MetricsResponse;
}

const REFRESH_INTERVAL_SECONDS = 30;

export function StatusPageView({
  slug,
  initialData,
  initialMetrics,
}: StatusPageViewProps) {
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("just now");

  const queryClient = useQueryClient();

  const { data = initialData } = usePublicStatus(slug, initialData);
  const { data: metrics = initialMetrics } = usePublicStatusMetrics(
    slug,
    initialMetrics,
  );

  // Manual & automatic refresh handler
  const handleRefresh = useCallback(async () => {
    if (!slug || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: statusKeys.public(slug) }),
        queryClient.invalidateQueries({ queryKey: statusKeys.metrics(slug) }),
      ]);
      setLastCheckedTime("just now");
    } finally {
      setCountdown(REFRESH_INTERVAL_SECONDS);
      setIsRefreshing(false);
    }
  }, [slug, isRefreshing, queryClient]);

  // Reactive countdown timer loop
  useEffect(() => {
    if (!slug) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [slug, handleRefresh]);

  const overallUptime = data.aggregateUptime;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/20">
      {/* Sticky Translucent Header */}
      <PublicStatusHeader
        statusPage={data.statusPage}
        overallStatus={data.status}
        countdown={countdown}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        {/* Global Operational Status Hero */}
        <SystemStatusHero
          status={data.status}
          overallUptime={overallUptime}
          monitors={data.monitors}
          lastCheckedTime={lastCheckedTime}
        />

        {/* Operational Telemetry Grid */}
        <section id="telemetry" className="pt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Operational Telemetry & SLAs
              </h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Last 60m window
            </span>
          </div>
          <MetricsGrid metrics={metrics} />
        </section>

        {/* Monitored Architecture & Services */}
        <section id="systems" className="pt-14">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Monitored Services & Endpoints
                </h2>
              </div>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {data.monitors.length}{" "}
              {data.monitors.length === 1 ? "service" : "services"} tracked
            </span>
          </div>

          <div className="space-y-3">
            {data.monitors.length > 0 ? (
              data.monitors.map((monitor) => (
                <ServiceMonitorCard key={monitor.name} monitor={monitor} />
              ))
            ) : (
              <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-center text-xs font-mono text-muted-foreground">
                No active endpoints configured for this public cluster.
              </div>
            )}
          </div>
        </section>

        {/* Incident History & Maintenance Log */}
        <section id="incidents" className="pt-14">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Incident & Maintenance Log
              </h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Recorded probe events
            </span>
          </div>

          <IncidentTimeline incidents={data.incidents} />
        </section>
      </main>

      {/* Infrastructure Footer */}
      <PublicStatusFooter statusPageName={data.statusPage.name} />

      {/* Subscribe Modal Dialog */}
      <SubscribeDialog
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        statusPageName={data.statusPage.name}
      />
    </div>
  );
}
