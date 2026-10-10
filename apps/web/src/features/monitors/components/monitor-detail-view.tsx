"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpDown,
  Activity,
  Check,
  Clock3,
  Gauge,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/ui/empty";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import {
  ResourceView,
  type Column,
} from "@operatio/ui/components/resource-view";
import { Button } from "@operatio/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@operatio/ui/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@operatio/ui/components/ui/tabs";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import {
  useMonitor,
  useMonitorChecks,
  useMonitorStats,
} from "@app/features/monitors/hooks/dashboard-queries";
import type {
  MonitorCheck,
  MonitorCheckSort,
} from "@app/features/monitors/api/monitors";
import { MonitorDialog } from "./monitor-dialog";
import { checkedAgo, MonitorStatusBadge } from "./monitor-presentational";
import { UptimeBars } from "@app/features/status/components/uptime-bars";

type CheckFilter = "ALL" | "UP" | "DOWN";
type CheckRange = "24h" | "7d" | "30d" | "90d" | "all";

const checkRanges: {
  value: CheckRange;
  label: string;
  milliseconds?: number;
}[] = [
  { value: "24h", label: "24 hours", milliseconds: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7 days", milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "30 days", milliseconds: 30 * 24 * 60 * 60 * 1000 },
  { value: "90d", label: "90 days", milliseconds: 90 * 24 * 60 * 60 * 1000 },
  { value: "all", label: "All time" },
];

const sortLabels: Record<MonitorCheckSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  slowest: "Slowest first",
};

function formatMilliseconds(value: number) {
  return `${value.toLocaleString()} ms`;
}

const checkColumns: Column<MonitorCheck>[] = [
  {
    header: "Checked",
    className: "whitespace-nowrap",
    cell: (check) => (
      <span className="font-mono text-xs text-muted-foreground">
        {new Date(check.checkedAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    ),
  },
  {
    header: "Result",
    cell: (check) => <MonitorStatusBadge status={check.status} />,
  },
  {
    header: "HTTP",
    className: "w-20",
    cell: (check) => (
      <span className="font-mono text-xs tabular-nums">
        {check.statusCode ?? "—"}
      </span>
    ),
  },
  {
    header: "Response",
    className: "whitespace-nowrap text-right",
    cell: (check) => (
      <span className="font-mono text-xs tabular-nums">
        {formatMilliseconds(check.responseTimeMs)}
      </span>
    ),
  },
  {
    header: "Details",
    className: "max-w-[16rem]",
    cell: (check) => (
      <span
        className="block truncate text-xs text-muted-foreground"
        title={check.error ?? undefined}
      >
        {check.error ?? "—"}
      </span>
    ),
  },
];

export function MonitorDetailView({
  orgSlug,
  monitorId,
}: {
  orgSlug: string;
  monitorId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [checkPage, setCheckPage] = useState(1);
  const [checkFilter, setCheckFilter] = useState<CheckFilter>("ALL");
  const [checkSort, setCheckSort] = useState<MonitorCheckSort>("newest");
  const [checkRange, setCheckRange] = useState<CheckRange>("24h");
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const fromDate = useMemo(() => {
    const range = checkRanges.find((option) => option.value === checkRange);
    return range?.milliseconds
      ? new Date(Date.now() - range.milliseconds).toISOString()
      : undefined;
  }, [checkRange]);
  const monitorQuery = useMonitor(organization?.id, monitorId);
  const checksQuery = useMonitorChecks(
    organization?.id,
    monitorId,
    checkPage,
    checkFilter === "ALL" ? undefined : checkFilter,
    checkSort,
    fromDate,
  );
  const statsQuery = useMonitorStats(organization?.id, monitorId);
  const listHref = `/${encodeURIComponent(orgSlug)}/dashboard/monitors`;

  if (organizations.isPending || (organization && monitorQuery.isPending)) {
    return <LoaderDisplay message="Loading monitor" />;
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

  if (monitorQuery.isError || !monitorQuery.data) {
    return (
      <ErrorDisplay
        title="Unable to load this monitor"
        message={
          monitorQuery.error?.message ?? "Monitor details are unavailable."
        }
        onRetry={() => void monitorQuery.refetch()}
        url={listHref}
        urlLabel="Back to monitors"
      />
    );
  }

  const monitor = monitorQuery.data;
  const stats = statsQuery.data;
  const checks = checksQuery.data?.checks ?? [];
  const cards = [
    {
      label: "Success rate",
      value:
        stats && stats.totalChecks > 0
          ? `${stats.checkSuccessRate.toFixed(2)}%`
          : "—",
      hint: stats
        ? `${stats.successfulChecks} successful checks`
        : "Check history",
      icon: Gauge,
    },
    {
      label: "Average response",
      value:
        stats && stats.totalChecks > 0
          ? formatMilliseconds(stats.averageResponseTime)
          : "—",
      hint: "Across recorded checks",
      icon: Activity,
    },
    {
      label: "Total checks",
      value: stats?.totalChecks.toLocaleString() ?? "—",
      hint: "Recorded for this monitor",
      icon: Clock3,
    },
    {
      label: "Failed checks",
      value: stats?.failedChecks.toLocaleString() ?? "—",
      hint: "Reported by the backend",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={listHref} />}
      >
        <ArrowLeft />
        All monitors
      </Button>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              {monitor.name}
            </h2>
              <MonitorStatusBadge
                status={monitor.status}
                isActive={monitor.isActive}
              />
          </div>
          <p className="break-all font-mono text-sm text-muted-foreground">
            {monitor.url}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil aria-hidden="true" />
          Edit monitor
        </Button>
      </section>

      {(statsQuery.isError || checksQuery.isError) && (
        <ErrorDisplay
          title="Some monitor history could not be loaded"
          message={
            statsQuery.error?.message ??
            checksQuery.error?.message ??
            "Please try again."
          }
          onRetry={() => {
            void statsQuery.refetch();
            void checksQuery.refetch();
          }}
        />
      )}

      <section
        aria-label="Monitor statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {label}
                <Icon className="size-4" aria-hidden="true" />
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {hint}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Monitor configuration</CardTitle>
          <CardDescription>
            Current settings reported by the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div>
            <p className="text-muted-foreground">Check frequency</p>
            <p className="mt-1 font-medium">
              {monitor.interval >= 60
                ? `Every ${Math.round((monitor.interval / 60) * 10) / 10} min${monitor.interval > 60 ? "s" : ""}`
                : `Every ${monitor.interval} secs`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Response timeout</p>
            <p className="mt-1 font-medium">
              {monitor.timeout / 1000} secs
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="mt-1 font-medium">{monitor.isActive ? "Active (Checking)" : "Paused"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Public visibility</p>
            <p className="mt-1 font-medium">{monitor.isPublic ? "Visible on status pages" : "Private only"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last checked</p>
            <p className="mt-1 font-medium">{checkedAgo(monitor.lastCheckedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uptime history</CardTitle>
          <CardDescription>
            Daily check results over the last 90 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UptimeBars data={stats?.dailyUptime ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Check history</CardTitle>
              <CardDescription>
                {checksQuery.data
                  ? `${checksQuery.data.meta.total.toLocaleString()} matching checks`
                  : "Recent results from this monitor"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" aria-label="Sort checks">
                    <ArrowUpDown aria-hidden="true" />
                    {sortLabels[checkSort]}
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {(["newest", "oldest", "slowest"] as const).map((sort) => (
                  <DropdownMenuItem
                    key={sort}
                    onClick={() => {
                      setCheckSort(sort);
                      setCheckPage(1);
                    }}
                  >
                    {checkSort === sort ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <span className="size-4" />
                    )}
                    {sortLabels[sort]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs
            value={checkFilter}
            onValueChange={(value) => {
              setCheckFilter(value as CheckFilter);
              setCheckPage(1);
            }}
          >
            <TabsList aria-label="Filter checks by result">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="UP">Successful</TabsTrigger>
              <TabsTrigger value="DOWN">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter checks by time range"
          >
            <span className="mr-1 text-sm text-muted-foreground">
              Time range
            </span>
            {checkRanges.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={checkRange === option.value ? "secondary" : "ghost"}
                aria-pressed={checkRange === option.value}
                onClick={() => {
                  setCheckRange(option.value);
                  setCheckPage(1);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {checksQuery.isPending ? (
            <LoaderDisplay message="Loading checks" />
          ) : checks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Clock3 />
                </EmptyMedia>
                <EmptyTitle>
                  {checkFilter === "ALL"
                    ? "No checks recorded yet"
                    : "No matching checks"}
                </EmptyTitle>
                <EmptyDescription>
                  {checkFilter === "ALL"
                    ? "Check history will appear here when the backend records a result."
                    : "Try another result filter to see more checks."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ResourceView<MonitorCheck>
              data={checks}
              keyExtractor={(check) => check.id}
              columns={checkColumns}
              defaultViewMode="table"
              rowOffset={(checkPage - 1) * 10}
              renderCard={(check) => (
                <Card key={check.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="font-mono text-sm">
                        {new Date(check.checkedAt).toLocaleString()}
                      </CardTitle>
                      <MonitorStatusBadge status={check.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">HTTP</p>
                      <p className="mt-1 font-mono tabular-nums">
                        {check.statusCode ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Response</p>
                      <p className="mt-1 font-mono tabular-nums">
                        {formatMilliseconds(check.responseTimeMs)}
                      </p>
                    </div>
                    {check.error && (
                      <p className="col-span-2 break-words text-xs text-muted-foreground">
                        {check.error}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            />
          )}
        </CardContent>
        {!!checksQuery.data && checksQuery.data.meta.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
            <p className="text-xs text-muted-foreground">
              Page {checksQuery.data.meta.page} of{" "}
              {checksQuery.data.meta.totalPages}
              <span className="mx-2 text-border">·</span>
              {checksQuery.data.meta.total.toLocaleString()} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={checkPage <= 1 || checksQuery.isFetching}
                onClick={() => setCheckPage((page) => page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  checkPage >= checksQuery.data.meta.totalPages ||
                  checksQuery.isFetching
                }
                onClick={() => setCheckPage((page) => page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <MonitorDialog
        organizationId={organization.id}
        monitor={monitor}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
