"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Plus,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useOrganizations } from "@app/features/auth/hooks/auth-queries";
import type { StatusPageSummary } from "@app/features/status/api/status-pages";
import {
  useStatusPages,
  useUpdateStatusPage,
} from "@app/features/status/hooks/status-pages-queries";
import { StatusPageDialog } from "@app/features/status/components/create-status-page-dialog";
import { getPublicStatusUrl } from "@app/features/status/lib/public-status-url";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@operatio/ui/components/ui/empty";
import {
  ResourceView,
  type Column,
} from "@operatio/ui/components/resource-view";
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

function StatusPageActions({
  organizationId,
  orgSlug,
  page,
  onEdit,
}: {
  organizationId: string;
  orgSlug: string;
  page: StatusPageSummary;
  onEdit: (page: StatusPageSummary) => void;
}) {
  const update = useUpdateStatusPage(organizationId, page.id);
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${page.name}`}
              disabled={update.isPending}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="whitespace-nowrap"
            onClick={() => onEdit(page)}
          >
            <Pencil aria-hidden="true" /> Edit page
          </DropdownMenuItem>
          <DropdownMenuItem
            className="whitespace-nowrap"
            render={
              <Link
                href={`/${encodeURIComponent(orgSlug)}/dashboard/status-pages/${page.id}`}
              />
            }
          >
            <Globe2 aria-hidden="true" /> Manage monitors
          </DropdownMenuItem>
          {page.isPublic && (
            <DropdownMenuItem
              className="whitespace-nowrap"
              render={
                <a
                  href={getPublicStatusUrl(page.slug)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink aria-hidden="true" /> View public page
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="whitespace-nowrap"
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { isPublic: !page.isPublic },
                {
                  onSuccess: () =>
                    toast.success(
                      page.isPublic
                        ? "Status page unpublished"
                        : "Status page published",
                    ),
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          >
            {page.isPublic ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {page.isPublic ? "Unpublish page" : "Publish page"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function StatusPagesView({ orgSlug }: { orgSlug: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StatusPageSummary>();
  const organizations = useOrganizations();
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const statusPages = useStatusPages(organization?.id);

  if (organizations.isPending || (organization && statusPages.isPending)) {
    return <LoaderDisplay message="Loading status pages" />;
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

  if (statusPages.isError) {
    return (
      <ErrorDisplay
        title="Unable to load status pages"
        message={statusPages.error.message}
        onRetry={() => void statusPages.refetch()}
      />
    );
  }

  const pages = statusPages.data ?? [];
  const publicCount = pages.filter((page) => page.isPublic).length;
  const columns: Column<StatusPageSummary>[] = [
    {
      header: "Status page",
      className: "pl-6",
      cell: (page) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{page.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {page.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      header: "Address",
      cell: (page) => (
        <a
          className="font-mono text-xs text-muted-foreground hover:underline"
          href={getPublicStatusUrl(page.slug)}
          target="_blank"
          rel="noreferrer"
        >
          {getPublicStatusUrl(page.slug)}
        </a>
      ),
    },
    {
      header: "Visibility",
      cell: (page) => (
        <span className="inline-flex items-center gap-2 text-sm">
          <span
            className={`size-2 rounded-full ${page.isPublic ? "bg-status-operational" : "bg-muted-foreground/50"}`}
          />
          {page.isPublic ? "Public" : "Private"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Status pages
          </h2>
          <p className="text-sm text-muted-foreground">
            Publish service health updates for {organization.name}.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPage(undefined);
            setCreateOpen(true);
          }}
        >
          <Plus aria-hidden="true" />
          Create status page
        </Button>
      </header>

      <section
        aria-label="Status page summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        {[
          { label: "Total pages", value: pages.length, icon: Globe2 },
          { label: "Public", value: publicCount, icon: ExternalLink },
          {
            label: "Private",
            value: pages.length - publicCount,
            icon: ShieldCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
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
              {label === "Total pages"
                ? "Created for this organization"
                : `${label} status pages`}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your status pages</CardTitle>
          <CardDescription>
            Manage publication and open public pages from the action menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResourceView<StatusPageSummary>
            data={pages}
            keyExtractor={(page) => page.id}
            columns={columns}
            defaultViewMode="table"
            renderActions={(page) => (
              <StatusPageActions
                organizationId={organization.id}
                orgSlug={orgSlug}
                page={page}
                onEdit={setEditingPage}
              />
            )}
            renderCard={(page) => (
              <Card key={page.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-base">
                        {page.name}
                      </CardTitle>
                      <CardDescription className="truncate font-mono text-xs">
                        {getPublicStatusUrl(page.slug)}
                      </CardDescription>
                    </div>
                    <StatusPageActions
                      organizationId={organization.id}
                      orgSlug={orgSlug}
                      page={page}
                      onEdit={setEditingPage}
                    />
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {page.description || "No description"}
                </CardContent>
              </Card>
            )}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Globe2 />
                  </EmptyMedia>
                  <EmptyTitle>No status pages yet</EmptyTitle>
                  <EmptyDescription>
                    Create a page to share service health with your customers.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setCreateOpen(true)}>
                    Create status page
                  </Button>
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>

      <StatusPageDialog
        key={editingPage?.id ?? "create"}
        organizationId={organization.id}
        page={editingPage}
        open={createOpen || !!editingPage}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingPage(undefined);
          }
        }}
      />
    </div>
  );
}
