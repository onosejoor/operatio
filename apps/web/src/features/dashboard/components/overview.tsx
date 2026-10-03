"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  CircleAlert,
  Clock3,
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
} from "@operatio/ui/components/empty";
import { Skeleton } from "@operatio/ui/components/ui/skeleton";

import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import {
  useMonitors,
  useOrganizationIncidents,
} from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorSummary } from "@app/features/monitors/api/monitors";
import { ResourceView } from "@operatio/ui/components/resource-view";
import type { Column } from "@operatio/ui/components/resource-view";
import { cn } from "@operatio/ui/lib/utils";

// --- Generic Resource View Component ---

type MonitorStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "maintenance"
  | "paused";

const STATUS: Record<
  MonitorStatus,
  { label: string; dot: string; badge: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-status-operational",
    badge: "bg-status-operational-muted text-status-operational-text",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-status-degraded",
    badge: "bg-status-degraded-muted text-status-degraded-text",
  },
  outage: {
    label: "Down",
    dot: "bg-status-outage",
    badge: "bg-status-outage-muted text-status-outage-text",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-status-maintenance",
    badge: "bg-status-maintenance-muted text-status-maintenance-text",
  },
  paused: {
    label: "Paused",
    dot: "bg-status-paused",
    badge: "bg-status-paused-muted text-status-paused-text",
  },
};

function getMonitorStatus(status: MonitorSummary["status"]): MonitorStatus {
  if (status === "UP") return "operational";
  if (status === "DOWN") return "outage";
  return "paused";
}

function MonitorState({ status }: { status: MonitorSummary["status"] }) {
  const monitorStatus = getMonitorStatus(status);
  const config = STATUS[monitorStatus];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.badge,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          config.dot,
          monitorStatus === "outage" && "status-pulse",
        )}
      />
      {config.label}
    </span>
  );
}

const SLOW_MS = 1000;
const VERY_SLOW_MS = 2000;
const MAX_MS = 3000;

function latencyTone(ms: number) {
  if (ms >= VERY_SLOW_MS)
    return { text: "text-status-outage-text", bar: "bg-status-outage" };
  if (ms >= SLOW_MS)
    return { text: "text-status-degraded-text", bar: "bg-status-degraded" };
  return { text: "text-foreground", bar: "bg-status-operational" };
}

function ResponseCell({
  ms,
  http,
}: {
  ms: number | null;
  http: number | null;
}) {
  if (ms === null) {
    return <span className="text-sm text-muted-foreground">No data</span>;
  }

  const tone = latencyTone(ms);
  const isError = http !== null && http >= 400;

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0">
        <span
          className={cn("font-mono text-sm font-medium tabular-nums", tone.text)}
        >
          {ms.toLocaleString()} ms
        </span>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            aria-hidden="true"
            className={cn("h-full rounded-full", tone.bar)}
            style={{ width: `${Math.min(ms / MAX_MS, 1) * 100}%` }}
          />
        </div>
      </div>
      {http !== null && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-xs",
            isError
              ? "bg-status-outage-muted text-status-outage-text"
              : "bg-muted text-muted-foreground",
          )}
        >
          {http}
        </span>
      )}
    </div>
  );
}

function checkedAgo(value: string | null) {
  if (!value) return "Not checked yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last check time unavailable";
  return formatDistanceToNow(date, { addSuffix: true });
}

function responseLabel(monitor: MonitorSummary) {
  return monitor.lastResponseTimeMs === null
    ? "—"
    : `${monitor.lastResponseTimeMs} ms`;
}

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
  const organizations = useOrganizations();
  const dashboardPath = `/${encodeURIComponent(orgSlug)}/dashboard`;
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

  const upCount = monitorList.filter(
    (monitor) => monitor.status === "UP",
  ).length;
  const downCount = monitorList.filter(
    (monitor) => monitor.status === "DOWN",
  ).length;

  const stats = [
    {
      label: "Total monitors",
      value: monitorList.length,
      icon: Activity,
      iconClass: "text-muted-foreground",
      hint: "Active monitors",
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

  const columns: Column<MonitorSummary>[] = [
    {
      header: "Monitor",
      className: "pl-6",
      cell: (monitor) => (
        <div className="max-w-0 sm:max-w-xs">
          <div className="truncate font-medium">{monitor.name}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {monitor.url}
          </div>
          <div className="mt-1 text-xs text-muted-foreground sm:hidden">
            {responseLabel(monitor)} · {checkedAgo(monitor.lastCheckedAt)}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (monitor) => <MonitorState status={monitor.status} />,
    },
    {
      header: "Response",
      className: "hidden sm:table-cell",
      cell: (monitor) => (
        <ResponseCell
          ms={monitor.lastResponseTimeMs}
          http={monitor.lastStatusCode}
        />
      ),
    },
    {
      header: "Last checked",
      className:
        "hidden pr-6 text-right font-mono text-muted-foreground md:table-cell",
      cell: (monitor) => checkedAgo(monitor.lastCheckedAt),
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

          {monitorList.length > 0 && (
            <Button
              className="w-fit"
              render={<Link href={`${dashboardPath}/monitors`} />}
            >
              View all
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <ResourceView<MonitorSummary>
            data={monitorList}
            keyExtractor={(monitor) => monitor.id}
            columns={columns}
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
                  <Button
                    nativeButton={false}
                    render={<Link href={`${dashboardPath}/monitors`} />}
                  >
                    Go to monitors
                  </Button>
                </EmptyContent>
              </Empty>
            }
            renderCard={(monitor) => (
              <Card key={monitor.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-1.5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-base font-semibold">
                      {monitor.name}
                    </CardTitle>
                    <MonitorState status={monitor.status} />
                  </div>
                  <CardDescription className="truncate text-xs">
                    {monitor.url}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {responseLabel(monitor)}
                    {monitor.lastStatusCode !== null && (
                      <span className="ml-1 text-muted-foreground/80">
                        ({monitor.lastStatusCode})
                      </span>
                    )}
                  </span>
                  <span className="font-mono">
                    {checkedAgo(monitor.lastCheckedAt)}
                  </span>
                </CardFooter>
              </Card>
            )}
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
    </div>
  );
}
