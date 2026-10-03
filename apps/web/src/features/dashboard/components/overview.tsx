"use client";

import { useState } from "react";
import {
  Activity,
  CircleAlert,
  Clock3,
  Plus,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/ui/empty";
import { Skeleton } from "@operatio/ui/components/ui/skeleton";

import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import {
  useMonitors,
  useOrganizationIncidents,
} from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorSummary } from "@app/features/monitors/api/monitors";
import { ResourceView } from "@operatio/ui/components/resource-view";
import { MonitorDialog } from "@app/features/monitors/components/monitor-dialog";
import {
  monitorColumns,
  MonitorSummaryCard,
} from "@app/features/monitors/components/monitor-presentational";

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-12" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-3 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Overview Component ---

export function Overview({ orgSlug }: { orgSlug: string }) {
  const [addMonitorOpen, setAddMonitorOpen] = useState(false);
  const organizations = useOrganizations();
  const organizationId = organizations.data?.find(
    (organization) => organization.slug === orgSlug,
  )?.id;
  const monitors = useMonitors(organizationId);
  const incidents = useOrganizationIncidents(organizationId);
  const monitorList = monitors.data ?? [];
  const activeIncidents = (incidents.data ?? []).filter(
    (incident) => !incident.resolvedAt,
  ).length;

  if (organizations.isPending || (organizationId && monitors.isPending)) {
    return <OverviewSkeleton />;
  }

  if (organizations.isError || monitors.isError) {
    const error = organizations.error ?? monitors.error;
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <ErrorDisplay
            title="Unable to load your monitoring data"
            message={error?.message ?? "Please try again."}
            onRetry={() => {
              void organizations.refetch();
              void monitors.refetch();
            }}
          />
        </Card>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Server />
              </EmptyMedia>
              <EmptyTitle>No organization found</EmptyTitle>
              <EmptyDescription>
                Your account doesn&apos;t belong to an organization yet. Contact
                your workspace administrator.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      </div>
    );
  }

  const enabledMonitors = monitorList.filter((monitor) => monitor.isActive);
  const pausedMonitorCount = monitorList.length - enabledMonitors.length;
  const upCount = enabledMonitors.filter(
    (monitor) => monitor.status === "UP",
  ).length;
  const downCount = enabledMonitors.filter(
    (monitor) => monitor.status === "DOWN",
  ).length;

  const stats = [
    {
      label: "Total monitors",
      value: monitorList.length,
      icon: Activity,
      iconClass: "text-muted-foreground",
      hint: `${enabledMonitors.length} enabled · ${pausedMonitorCount} paused`,
    },
    {
      label: "Operational",
      value: upCount,
      icon: ShieldCheck,
      iconClass:
        upCount > 0 ? "text-status-operational" : "text-muted-foreground",
      hint: "Reporting UP",
    },
    {
      label: "Outage",
      value: downCount,
      icon: CircleAlert,
      iconClass: downCount > 0 ? "text-status-outage" : "text-muted-foreground",
      hint: "Reporting DOWN",
    },
    {
      label: "Active incidents",
      value: incidents.isError ? "—" : activeIncidents,
      icon: Clock3,
      iconClass: "text-muted-foreground",
      hint: incidents.isError
        ? "Unable to load incidents"
        : "Unresolved incidents",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Monitor the health of your services.
      </p>

      <section
        aria-label="Monitor summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, hint }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold tabular-nums">
                {value}
              </CardTitle>
            </CardHeader>
            <CardFooter className="text-xs text-muted-foreground">
              {hint}
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monitors</CardTitle>
            <CardDescription>
              Current state from your latest checks · {monitorList.length} total
            </CardDescription>
          </div>

          <Button className="w-fit" onClick={() => setAddMonitorOpen(true)}>
            <Plus />
            Add monitor
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <ResourceView<MonitorSummary>
            data={monitorList}
            keyExtractor={(monitor) => monitor.id}
            columns={monitorColumns}
            defaultViewMode="cards"
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Server />
                  </EmptyMedia>
                  <EmptyTitle>No monitors yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first monitor to start tracking uptime.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setAddMonitorOpen(true)}>
                    Add your first monitor
                  </Button>
                </EmptyContent>
              </Empty>
            }
            renderCard={(monitor) => <MonitorSummaryCard monitor={monitor} />}
          />
        </CardContent>

        {incidents.isError && (
          <CardFooter
            role="status"
            className="border-t text-xs text-muted-foreground"
          >
            Incident totals are temporarily unavailable.
          </CardFooter>
        )}
      </Card>
      <MonitorDialog
        organizationId={organizationId}
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
      />
    </div>
  );
}
