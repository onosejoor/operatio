"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import { useMonitors } from "@app/features/monitors/hooks/dashboard-queries";
import type { MonitorSummary } from "@app/features/monitors/api/monitors";
import {
  useAddStatusPageMonitor,
  useRemoveStatusPageMonitor,
  useStatusPage,
  useStatusPageMonitors,
  useUpdateStatusPage,
} from "@app/features/status/hooks/status-pages-queries";
import type { StatusPageMonitor } from "@app/features/status/api/status-pages";
import { StatusPageDialog } from "@app/features/status/components/create-status-page-dialog";
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
import { toast } from "@operatio/ui/components/ui/sonner";
import { MonitorStatusBadge } from "@app/features/monitors/components/monitor-presentational";
import { getPublicStatusUrl } from "@app/features/status/lib/public-status-url";

function RemoveStatusMonitorButton({
  organizationId,
  statusPageId,
  monitorId,
}: {
  organizationId: string;
  statusPageId: string;
  monitorId: string;
}) {
  const remove = useRemoveStatusPageMonitor(organizationId, statusPageId);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Remove monitor from status page"
      disabled={remove.isPending}
      onClick={() =>
        remove.mutate(monitorId, {
          onSuccess: () => toast.success("Monitor removed from status page"),
          onError: (error) => toast.error(error.message),
        })
      }
    >
      <Trash2 aria-hidden="true" />
    </Button>
  );
}

export function StatusPageDetailView({
  orgSlug,
  statusPageId,
}: {
  orgSlug: string;
  statusPageId: string;
}) {
  const organizations = useOrganizations();
  const [editOpen, setEditOpen] = useState(false);
  const organization = organizations.data?.find((item) => item.slug === orgSlug);
  const page = useStatusPage(organization?.id, statusPageId);
  const pageMonitors = useStatusPageMonitors(organization?.id, statusPageId);
  const monitors = useMonitors(organization?.id);
  const addMonitor = useAddStatusPageMonitor(organization?.id ?? "", statusPageId);
  const updatePage = useUpdateStatusPage(organization?.id ?? "", statusPageId);

  if (
    organizations.isPending ||
    (organization && (page.isPending || pageMonitors.isPending || monitors.isPending))
  ) {
    return <LoaderDisplay message="Loading status page" />;
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

  const queryError = page.error ?? pageMonitors.error ?? monitors.error;
  if (queryError || !page.data) {
    return (
      <ErrorDisplay
        title="Unable to load this status page"
        message={queryError?.message ?? "Status page details are unavailable."}
        onRetry={() => {
          void page.refetch();
          void pageMonitors.refetch();
          void monitors.refetch();
        }}
        url={`/${encodeURIComponent(orgSlug)}/dashboard/status-pages`}
        urlLabel="Back to status pages"
      />
    );
  }

  const attached = pageMonitors.data ?? [];
  const attachedIds = new Set(attached.map((entry) => entry.monitorId));
  const available = (monitors.data ?? []).filter(
    (monitor) => monitor.isActive && monitor.isPublic && !attachedIds.has(monitor.id),
  );

  const columns: Column<StatusPageMonitor>[] = [
    {
      header: "Monitor",
      className: "pl-6",
      cell: (entry) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.monitor.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {entry.monitor.url}
          </p>
        </div>
      ),
    },
    {
      header: "Current status",
      cell: (entry) => (
        <MonitorStatusBadge status={entry.monitor.status} isActive={entry.monitor.isActive} />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={`/${encodeURIComponent(orgSlug)}/dashboard/status-pages`} />}
      >
        <ArrowLeft aria-hidden="true" />
        All status pages
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{page.data.name}</h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {page.data.isPublic ? "Published" : "Private"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {page.data.description || "Choose which enabled monitors appear on this page."}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {getPublicStatusUrl(page.data.slug)}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil aria-hidden="true" /> Edit page
        </Button>
      </header>

      <ol aria-label="Status page setup" className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Customize", detail: "Name, address, and brand color", done: true },
          { title: "Choose monitors", detail: `${attached.length} selected`, done: attached.length > 0 },
          { title: "Publish", detail: page.data.isPublic ? "Live for visitors" : "Private until ready", done: page.data.isPublic },
        ].map((step, index) => (
          <li key={step.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step.done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className="min-w-0"><span className="block text-sm font-medium">{step.title}</span><span className="block truncate text-xs text-muted-foreground">{step.detail}</span></span>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>Step 1 · Customize your page</CardTitle>
          <CardDescription>Set the public page name, description, URL, and brand color.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="size-8 rounded-lg border" style={{ backgroundColor: page.data.brandColor ?? "#2563eb" }} aria-label={`Brand color ${page.data.brandColor ?? "#2563eb"}`} />
            <span><span className="block font-medium">Brand color</span><span className="font-mono text-xs text-muted-foreground">{page.data.brandColor ?? "#2563eb"}</span></span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil aria-hidden="true" /> Edit page settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2 · Choose monitors</CardTitle>
          <CardDescription>
            {attached.length} {attached.length === 1 ? "monitor" : "monitors"} selected.
            Only enabled monitors allowed on public pages appear to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResourceView<StatusPageMonitor>
            data={attached}
            keyExtractor={(entry) => entry.id}
            columns={columns}
            defaultViewMode="table"
            renderActions={(entry) => (
              <RemoveStatusMonitorButton
                organizationId={organization.id}
                statusPageId={statusPageId}
                monitorId={entry.monitorId}
              />
            )}
            renderCard={(entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="truncate text-base">
                      {entry.monitor.name}
                    </CardTitle>
                    <MonitorStatusBadge
                      status={entry.monitor.status}
                      isActive={entry.monitor.isActive}
                    />
                  </div>
                  <CardDescription className="truncate font-mono text-xs">
                    {entry.monitor.url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <RemoveStatusMonitorButton
                    organizationId={organization.id}
                    statusPageId={statusPageId}
                    monitorId={entry.monitorId}
                  />
                </CardContent>
              </Card>
            )}
            emptyState={
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                No monitors have been added to this page yet.
              </div>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add monitors</CardTitle>
          <CardDescription>
            Choose enabled monitors with public status visibility turned on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No eligible monitors are available. Enable a monitor and allow it on
              public status pages to add it here.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {available.map((monitor: MonitorSummary) => (
                <div
                  key={monitor.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{monitor.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {monitor.url}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={addMonitor.isPending}
                    onClick={() =>
                      addMonitor.mutate(
                        { monitorId: monitor.id, order: attached.length },
                        {
                          onSuccess: () => toast.success("Monitor added to status page"),
                          onError: (error) => toast.error(error.message),
                        },
                      )
                    }
                  >
                    <Plus aria-hidden="true" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3 · Publish and preview</CardTitle>
          <CardDescription>When you publish, visitors can see this page and its selected public monitors.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">This page is currently <span className="font-medium text-foreground">{page.data.isPublic ? "published" : "private"}</span>.</p>
          <div className="flex flex-wrap gap-2">
            {page.data.isPublic && <Button variant="outline" nativeButton={false} render={<a href={getPublicStatusUrl(page.data.slug)} target="_blank" rel="noreferrer" />}><ExternalLink aria-hidden="true" /> Preview public page</Button>}
            <Button disabled={updatePage.isPending} variant={page.data.isPublic ? "outline" : "default"} onClick={() => updatePage.mutate({ isPublic: !page.data.isPublic }, { onSuccess: () => toast.success(page.data.isPublic ? "Status page unpublished" : "Status page published"), onError: (error) => toast.error(error.message) })}>{page.data.isPublic ? "Unpublish page" : "Publish page"}</Button>
          </div>
        </CardContent>
      </Card>
      <StatusPageDialog key={page.data.id} organizationId={organization.id} page={page.data} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
