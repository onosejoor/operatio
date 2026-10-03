"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  Ellipsis,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import { useStatusPages } from "@app/features/status/hooks/status-pages-queries";
import type { MaintenanceWindow } from "../api/maintenance";
import {
  useCancelMaintenanceWindow,
  useMaintenanceWindows,
} from "../hooks/maintenance-queries";
import { MaintenanceWindowDialog } from "./maintenance-window-dialog";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import {
  ResourceView,
  type Column,
} from "@operatio/ui/components/resource-view";
import { Button } from "@operatio/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@operatio/ui/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/ui/empty";
import { toast } from "@operatio/ui/components/ui/sonner";

const UPCOMING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function getState(item: MaintenanceWindow, now: number) {
  const start = new Date(item.startsAt).getTime();
  const end = new Date(item.endsAt).getTime();
  if (start > now)
    return {
      label: "Scheduled",
      className: "bg-status-maintenance-muted text-status-maintenance-text",
    };
  if (end >= now)
    return {
      label: "In progress",
      className: "bg-status-operational-muted text-status-operational-text",
    };
  return { label: "Completed", className: "bg-muted text-muted-foreground" };
}

function MaintenanceActions({
  organizationId,
  item,
  onEdit,
}: {
  organizationId: string;
  item: MaintenanceWindow;
  onEdit: (item: MaintenanceWindow) => void;
}) {
  const cancel = useCancelMaintenanceWindow(organizationId);
  const isFinished = new Date(item.endsAt).getTime() < Date.now();
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${item.title}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="whitespace-nowrap"
            disabled={isFinished}
            onClick={() => onEdit(item)}
          >
            <Pencil aria-hidden="true" /> Edit schedule
          </DropdownMenuItem>
          <DropdownMenuItem
            className="whitespace-nowrap"
            render={
              <Link
                href={`/status/${encodeURIComponent(item.statusPage.slug)}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink aria-hidden="true" /> View status page
          </DropdownMenuItem>
          <DropdownMenuItem
            className="whitespace-nowrap"
            variant="destructive"
            disabled={cancel.isPending || isFinished}
            onClick={() =>
              cancel.mutate(item.id, {
                onSuccess: (data) =>
                  toast.success(data.message || "Maintenance cancelled"),
                onError: (error) => toast.error(error.message),
              })
            }
          >
            <Trash2 aria-hidden="true" /> Cancel schedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MaintenanceView({ orgSlug }: { orgSlug: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceWindow>();
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const statusPagesQuery = useStatusPages(organization?.id);
  const maintenance = useMaintenanceWindows(organization?.id);

  if (
    organizations.isPending ||
    (organization && (statusPagesQuery.isPending || maintenance.isPending))
  )
    return <LoaderDisplay message="Loading maintenance schedules" />;
  if (organizations.isError)
    return (
      <ErrorDisplay
        title="Unable to load workspaces"
        message={organizations.error.message}
        onRetry={() => void organizations.refetch()}
      />
    );
  if (!organization)
    return (
      <ErrorDisplay
        title="Workspace not found"
        message="This workspace is not available to your account."
      />
    );
  if (statusPagesQuery.isError || maintenance.isError) {
    const error = statusPagesQuery.error ?? maintenance.error!;
    return (
      <ErrorDisplay
        title="Unable to load maintenance"
        message={error.message}
        onRetry={() => {
          void statusPagesQuery.refetch();
          void maintenance.refetch();
        }}
      />
    );
  }

  const pages = statusPagesQuery.data ?? [];
  const items = maintenance.data ?? [];
  const now = Date.now();
  const horizon = now + UPCOMING_DAYS * DAY_MS;
  const upcomingCount = items.filter((item) => {
    const start = new Date(item.startsAt).getTime();
    return start > now && start <= horizon;
  }).length;
  const activeCount = items.filter(
    (item) =>
      new Date(item.startsAt).getTime() <= now &&
      new Date(item.endsAt).getTime() >= now,
  ).length;
  const columns: Column<MaintenanceWindow>[] = [
    {
      header: "Maintenance",
      className: "pl-6",
      cell: (item) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.description || "No visitor message provided"}
          </p>
        </div>
      ),
    },
    {
      header: "Status page",
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{item.statusPage.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.statusPage.isPublic ? "Public" : "Private"}
          </p>
        </div>
      ),
    },
    {
      header: "Schedule",
      cell: (item) => (
        <div className="space-y-0.5 text-sm tabular-nums">
          <p>{format(new Date(item.startsAt), "MMM d, yyyy · h:mm a")}</p>
          <p className="text-xs text-muted-foreground">
            to {format(new Date(item.endsAt), "MMM d · h:mm a")}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (item) => {
        const state = getState(item, now);
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${state.className}`}
          >
            {state.label}
          </span>
        );
      },
    },
  ];
  const sorted = [...items].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Maintenance</h2>
          <p className="text-sm text-muted-foreground">
            Schedule service work and notify visitors on your public status
            pages.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setCreateOpen(true);
          }}
          disabled={pages.length === 0}
        >
          <Plus aria-hidden="true" /> Schedule maintenance
        </Button>
      </header>

      <section
        aria-label="Maintenance summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        {[
          {
            label: "Upcoming · 30 days",
            value: upcomingCount,
            icon: CalendarClock,
            note: "On status pages",
          },
          {
            label: "In progress",
            value: activeCount,
            icon: Wrench,
            note: "Currently underway",
          },
          {
            label: "Completed",
            value:
              items.length -
              items.filter((item) => new Date(item.endsAt).getTime() >= now)
                .length,
            icon: CheckCircle2,
            note: "Past maintenance",
          },
        ].map(({ label, value, icon: Icon, note }) => (
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
              {note}
            </CardContent>
          </Card>
        ))}
      </section>

      {pages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-medium">
              Create a status page before scheduling maintenance
            </p>
            <p className="max-w-lg text-sm text-muted-foreground">
              Maintenance notices are shown to visitors on a status page. Set up
              a page first, then return here to schedule work.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={`/${encodeURIComponent(orgSlug)}/dashboard/status-pages`}
                />
              }
            >
              Go to status pages
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Maintenance schedule
          </CardTitle>
          <CardDescription>
            Windows starting within the next 30 days and active windows appear
            in public notices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResourceView<MaintenanceWindow>
            data={sorted}
            keyExtractor={(item) => item.id}
            columns={columns}
            defaultViewMode="table"
            renderActions={(item) => (
              <MaintenanceActions
                organizationId={organization.id}
                item={item}
                onEdit={setEditing}
              />
            )}
            renderCard={(item) => {
              const state = getState(item, now);
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base font-semibold">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {item.statusPage.name} ·{" "}
                          {item.statusPage.isPublic ? "Public" : "Private"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${state.className}`}
                        >
                          {state.label}
                        </span>
                        <MaintenanceActions
                          organizationId={organization.id}
                          item={item}
                          onEdit={setEditing}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {format(new Date(item.startsAt), "MMM d, yyyy · h:mm a")} –{" "}
                    {format(new Date(item.endsAt), "MMM d · h:mm a")}
                  </CardContent>
                </Card>
              );
            }}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarClock />
                  </EmptyMedia>
                  <EmptyTitle>No maintenance scheduled</EmptyTitle>
                  <EmptyDescription>
                    Schedule planned work to give visitors advance notice.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {pages.length > 0 && (
                    <Button onClick={() => setCreateOpen(true)}>
                      Schedule maintenance
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>

      <MaintenanceWindowDialog
        key={editing?.id ?? "new"}
        organizationId={organization.id}
        statusPages={pages}
        window={editing}
        open={createOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditing(undefined);
          }
        }}
      />
    </div>
  );
}
