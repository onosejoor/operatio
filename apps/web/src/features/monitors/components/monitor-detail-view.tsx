"use client";

import { useState } from "react";
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
} from "@operatio/ui/components/empty";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import { Button } from "@operatio/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@operatio/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@operatio/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@operatio/ui/components/tabs";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import {
  useMonitor,
  useMonitorChecks,
  useMonitorStats,
} from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorCheckSort } from "@app/features/monitors/api/monitors";
import { EditMonitorDialog } from "./edit-monitor-dialog";
import { checkedAgo, MonitorStatusBadge } from "./monitor-presentational";

type CheckFilter = "ALL" | "UP" | "DOWN";

const sortLabels: Record<MonitorCheckSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  slowest: "Slowest first",
};

function formatMilliseconds(value: number) {
  return `${value.toLocaleString()} ms`;
}

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
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const monitorQuery = useMonitor(organization?.id, monitorId);
  const checksQuery = useMonitorChecks(
    organization?.id,
    monitorId,
    checkPage,
    checkFilter === "ALL" ? undefined : checkFilter,
    checkSort,
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
            <MonitorStatusBadge status={monitor.status} />
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
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Check interval</p>
            <p className="mt-1 font-mono tabular-nums">
              {monitor.interval} sec
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Timeout</p>
            <p className="mt-1 font-mono tabular-nums">
              {formatMilliseconds(monitor.timeout)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Public status pages</p>
            <p className="mt-1">{monitor.isPublic ? "Allowed" : "Disabled"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last checked</p>
            <p className="mt-1">{checkedAgo(monitor.lastCheckedAt)}</p>
          </div>
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
              <TabsTrigger value="ALL">
                All {stats?.totalChecks.toLocaleString() ?? ""}
              </TabsTrigger>
              <TabsTrigger value="UP">
                Successful {stats?.successfulChecks.toLocaleString() ?? ""}
              </TabsTrigger>
              <TabsTrigger value="DOWN">
                Failed {stats?.failedChecks.toLocaleString() ?? ""}
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Checked</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead className="text-right">Response</TableHead>
                  <TableHead className="pr-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      {new Date(check.checkedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <MonitorStatusBadge status={check.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {check.statusCode ?? "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                      {formatMilliseconds(check.responseTimeMs)}
                    </TableCell>
                    <TableCell
                      className="max-w-[16rem] truncate pr-6 text-xs text-muted-foreground"
                      title={check.error ?? undefined}
                    >
                      {check.error ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      <EditMonitorDialog
        organizationId={organization.id}
        monitor={monitor}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
