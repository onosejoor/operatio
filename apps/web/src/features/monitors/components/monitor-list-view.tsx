"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Ellipsis,
  Eye,
  Pause,
  Play,
  Plus,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/ui/empty";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import { ResourceView } from "@operatio/ui/components/resource-view";
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
} from "@operatio/ui/components/ui/dropdown-menu";
import { toast } from "@operatio/ui/components/ui/sonner";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import { useMonitors } from "@app/features/monitors/hooks/dashboard-queries";
import { useUpdateMonitor } from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorSummary } from "@app/features/monitors/api/monitors";
import { MonitorDialog } from "./monitor-dialog";
import { monitorColumns, MonitorSummaryCard } from "./monitor-presentational";

function MonitorActions({
  organizationId,
  orgSlug,
  monitor,
}: {
  organizationId: string;
  orgSlug: string;
  monitor: MonitorSummary;
}) {
  const updateMonitor = useUpdateMonitor(organizationId, monitor.id);

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${monitor.name}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="whitespace-nowrap *:shrink-0"
            render={
              <Link
                href={`/${encodeURIComponent(orgSlug)}/dashboard/monitors/${monitor.id}`}
              />
            }
          >
            <Eye aria-hidden="true" />
            View monitor details
          </DropdownMenuItem>
          <DropdownMenuItem
            className="whitespace-nowrap"
            disabled={updateMonitor.isPending}
            onClick={() =>
              updateMonitor.mutate(
                { isActive: !monitor.isActive },
                {
                  onSuccess: () =>
                    toast.success(
                      monitor.isActive ? "Monitor disabled" : "Monitor enabled",
                    ),
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          >
            {monitor.isActive ? (
              <>
                <Pause aria-hidden="true" />
                Disable monitoring
              </>
            ) : (
              <>
                <Play aria-hidden="true" />
                Re-enable monitoring
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MonitorListView({ orgSlug }: { orgSlug: string }) {
  const [addMonitorOpen, setAddMonitorOpen] = useState(false);
  const router = useRouter();
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const monitors = useMonitors(organization?.id);

  if (organizations.isPending || (organization && monitors.isPending)) {
    return <LoaderDisplay message="Loading monitors" />;
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

  if (monitors.isError) {
    return (
      <ErrorDisplay
        title="Unable to load monitors"
        message={monitors.error.message}
        onRetry={() => void monitors.refetch()}
      />
    );
  }

  const monitorList = monitors.data ?? [];
  const enabledCount = monitorList.filter((monitor) => monitor.isActive).length;
  const pausedCount = monitorList.length - enabledCount;
  const downCount = monitorList.filter(
    (monitor) => monitor.isActive && monitor.status === "DOWN",
  ).length;
  const monitorStats = [
    {
      label: "Total monitors",
      value: monitorList.length,
      hint: "Across this organization",
      icon: Server,
    },
    {
      label: "Monitoring",
      value: enabledCount,
      hint: "Checks are enabled",
      icon: Activity,
    },
    {
      label: "Paused",
      value: pausedCount,
      hint: "Can be re-enabled anytime",
      icon: Pause,
    },
    {
      label: "Currently down",
      value: downCount,
      hint: "Among enabled monitors",
      icon: downCount > 0 ? ShieldAlert : ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Monitors</h2>
          <p className="text-sm text-muted-foreground">
            Manage endpoints monitored by {organization.name}.
          </p>
        </div>
        <Button onClick={() => setAddMonitorOpen(true)}>
          <Plus />
          Add monitor
        </Button>
      </div>

      <section
        aria-label="Monitor summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {monitorStats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {label}
                <Icon className="size-4" aria-hidden="true" />
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {value.toLocaleString()}
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
          <CardTitle className="text-xl font-bold tracking-tight">All monitors</CardTitle>
          <CardDescription className="text-sm font-medium">
            {monitorList.filter((monitor) => monitor.isActive).length} enabled ·{" "}
            {monitorList.filter((monitor) => !monitor.isActive).length} paused ·{" "}
            {monitorList.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResourceView<MonitorSummary>
            data={monitorList}
            keyExtractor={(monitor) => monitor.id}
            columns={monitorColumns}
            defaultViewMode="table"
            renderActions={(monitor) => (
              <MonitorActions
                organizationId={organization.id}
                orgSlug={orgSlug}
                monitor={monitor}
              />
            )}
            onRowClick={(monitor) =>
              router.push(
                `/${encodeURIComponent(orgSlug)}/dashboard/monitors/${monitor.id}`,
              )
            }
            renderCard={(monitor) => (
              <Link
                href={`/${encodeURIComponent(orgSlug)}/dashboard/monitors/${monitor.id}`}
                className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`View ${monitor.name} monitor`}
              >
                <MonitorSummaryCard monitor={monitor} />
              </Link>
            )}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Server />
                  </EmptyMedia>
                  <EmptyTitle>No monitors yet</EmptyTitle>
                  <EmptyDescription>
                    Add a URL to start tracking uptime for this organization.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setAddMonitorOpen(true)}>
                    Add your first monitor
                  </Button>
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>

      <MonitorDialog
        organizationId={organization.id}
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
      />
    </div>
  );
}
