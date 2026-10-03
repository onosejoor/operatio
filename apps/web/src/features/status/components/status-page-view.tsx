"use client";

import { useState } from "react";
import { usePublicStatus } from "@app/features/status/hooks/use-public-status";
import type {
  PublicStatusResponse,
  PublicMonitor,
} from "@app/features/status/types/public-status";
import { SystemStatusHero } from "@app/features/status/components/system-status-hero";
import { ServiceMonitorCard } from "@app/features/status/components/service-monitor-card";
import { ServiceDetailsDialog } from "@app/features/status/components/service-details-dialog";
import {
  ActiveIncidents,
  IncidentHistory,
} from "@app/features/status/components/incident-timeline";
import { Server, History, AlertCircle, CalendarClock } from "lucide-react";
import { Badge } from "@operatio/ui/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@operatio/ui/components/ui/alert";
import { cn } from "@operatio/ui/lib/utils";
import { format, isSameDay } from "date-fns";

function formatRange(startsAt: string | Date, endsAt: string | Date) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  // Same day: "Oct 3, 9:00 PM – 10:00 PM" instead of repeating the date
  if (isSameDay(start, end)) {
    return `${format(start, "MMM d, h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`;
}

interface StatusPageViewProps {
  slug: string;
  initialData: PublicStatusResponse;
}

export function StatusPageView({ slug, initialData }: StatusPageViewProps) {
  const [selectedMonitor, setSelectedMonitor] = useState<PublicMonitor | null>(
    null,
  );

  const { data = initialData } = usePublicStatus(slug, initialData);

  const activeIncidents = data.incidents.filter((i) => i.status === "active");
  const overallUptime = data.aggregateUptime;
  const maintenanceWindows = data.maintenanceWindows ?? [];
  const now = Date.now();

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        {/* Overall Status Hero */}
        <SystemStatusHero status={data.status} overallUptime={overallUptime} />

        {maintenanceWindows.length > 0 && (
          <section
            aria-label="Scheduled maintenance"
            className="mt-6 space-y-3"
          >
            {maintenanceWindows.map((window) => {
              const inProgress = new Date(window.startsAt).getTime() <= now;

              return (
                <Alert
                  key={`${window.title}-${window.startsAt}`}
                  role="status"
                  className="border-status-maintenance/25 bg-status-maintenance-muted px-4 py-3.5 text-status-maintenance-text"
                >
                  <CalendarClock aria-hidden="true" />

                  <AlertTitle className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-status-maintenance-text">
                    <span className="font-medium">{window.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1.5 rounded-full border-status-maintenance/30 bg-background/60 px-2 py-0.5 text-xs font-medium text-status-maintenance-text",
                      )}
                    >
                      {inProgress && (
                        <span className="status-dot size-1.5 bg-status-maintenance status-ping" />
                      )}
                      {inProgress ? "In progress" : "Upcoming"}
                    </Badge>
                  </AlertTitle>

                  <AlertDescription className="space-y-1.5">
                    {window.description && (
                      <p className="text-muted-foreground">
                        {window.description}
                      </p>
                    )}
                    <p className="text-xs font-medium tabular-nums text-status-maintenance-text">
                      {formatRange(window.startsAt, window.endsAt)}
                    </p>
                  </AlertDescription>
                </Alert>
              );
            })}
          </section>
        )}

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

      {/* Progressive Disclosure Dialog: Service Details */}
      <ServiceDetailsDialog
        monitor={selectedMonitor}
        isOpen={Boolean(selectedMonitor)}
        onClose={() => setSelectedMonitor(null)}
      />
    </>
  );
}
