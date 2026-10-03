"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, Eye, Plus, Server } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/empty";
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
} from "@operatio/ui/components/dropdown-menu";
import type { Column } from "@operatio/ui/components/resource-view";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import { useMonitors } from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorSummary } from "@app/features/monitors/api/monitors";
import { AddMonitorDialog } from "./add-monitor-dialog";
import {
  monitorColumns,
  MonitorSummaryCard,
} from "./monitor-presentational";

export function MonitorListView({ orgSlug }: { orgSlug: string }) {
  const [addMonitorOpen, setAddMonitorOpen] = useState(false);
  const router = useRouter();
  const organizations = useOrganizations();
  const organization = organizations.data?.find((item) => item.slug === orgSlug);
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
  const columns: Column<MonitorSummary>[] = [
    ...monitorColumns,
    {
      header: "",
      className: "w-12 text-right",
      cell: (monitor) => (
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
                render={
                  <Link
                    href={`/${encodeURIComponent(orgSlug)}/dashboard/monitors/${monitor.id}`}
                  />
                }
              >
                <Eye aria-hidden="true" />
                View monitor details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
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

      <Card>
        <CardHeader>
          <CardTitle>All monitors</CardTitle>
          <CardDescription>
            {monitorList.length} active {monitorList.length === 1 ? "monitor" : "monitors"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResourceView<MonitorSummary>
            data={monitorList}
            keyExtractor={(monitor) => monitor.id}
            columns={columns}
            defaultViewMode="table"
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

      <AddMonitorDialog
        organizationId={organization.id}
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
      />
    </div>
  );
}
