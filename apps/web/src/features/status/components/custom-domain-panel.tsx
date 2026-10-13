"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@operatio/ui/components/ui/sonner";
import { Button } from "@operatio/ui/components/ui/button";
import { Input } from "@operatio/ui/components/ui/input";
import { Badge } from "@operatio/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import { Skeleton } from "@operatio/ui/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@operatio/ui/components/ui/alert";
import {
  useCustomDomainStatus,
  useRemoveCustomDomain,
  useSetCustomDomain,
} from "../hooks/status-pages-queries";
import type { CustomDomainStatus } from "../api/status-pages";

interface CustomDomainPanelProps {
  organizationId: string;
  statusPageId: string;
}

const statusConfig: Record<
  CustomDomainStatus,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "operational"
      | "degraded"
      | "outage"
      | "pending";
  }
> = {
  PENDING: {
    label: "Connecting...",
    variant: "pending",
  },
  PENDING_DNS: {
    label: "Awaiting DNS",
    variant: "degraded",
  },
  PENDING_SSL: {
    label: "Issuing SSL...",
    variant: "secondary",
  },
  ACTIVE: {
    label: "Active",
    variant: "operational",
  },
  FAILED: {
    label: "Failed",
    variant: "outage",
  },
};

function StatusBadge({ status }: { status: CustomDomainStatus }) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function CustomDomainPanel({
  organizationId,
  statusPageId,
}: CustomDomainPanelProps) {
  const [input, setInput] = useState("");

  const {
    data: customDomain,
    isLoading,
    isFetching,
    refetch,
  } = useCustomDomainStatus(organizationId, statusPageId);

  const setDomain = useSetCustomDomain(organizationId, statusPageId);
  const removeDomain = useRemoveCustomDomain(organizationId, statusPageId);

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setDomain.mutate(input.trim(), {
      onSuccess: () => {
        setInput("");
        toast.success("Custom domain connected. Set the DNS record below.");
      },
      onError: (err) =>
        toast.error((err as Error).message || "Failed to connect domain"),
    });
  }

  function handleRemove() {
    removeDomain.mutate(undefined, {
      onSuccess: () => toast.success("Custom domain removed"),
      onError: (err) =>
        toast.error((err as Error).message || "Failed to remove domain"),
    });
  }

  function handleRefresh() {
    void refetch().then(({ error }) => {
      if (error) {
        toast.error(error.message || "Failed to refresh domain status");
      } else {
        toast.success("Domain status refreshed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle>Custom Domain</CardTitle>
        </div>
        <CardDescription>
          Serve your status page from your own domain (e.g.{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            status.yourcompany.com
          </code>
          ).
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : !customDomain ? (
          <form
            onSubmit={handleConnect}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="w-full max-w-sm">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="status.yourcompany.com"
              />
            </div>
            <Button
              type="submit"
              disabled={setDomain.isPending || !input.trim()}
            >
              {setDomain.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {setDomain.isPending ? "Connecting..." : "Connect Domain"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-medium">
                  {customDomain.domain}
                </span>
                <StatusBadge status={customDomain.status} />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetching || removeDomain.isPending}
                >
                  {isFetching ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  )}
                  {isFetching ? "Refreshing..." : "Refresh status"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={removeDomain.isPending || isFetching}
                >
                  {removeDomain.isPending ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                  {removeDomain.isPending ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>

            {/* DNS Instructions card */}
            {customDomain.status !== "ACTIVE" &&
              customDomain.status !== "FAILED" &&
              (customDomain.dnsRecords?.length || customDomain.cnameValue) && (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Add this DNS record at your registrar
                  </p>
                  <div className="mt-3 space-y-3 font-mono text-xs">
                    {customDomain.dnsRecords?.length ? (
                      customDomain.dnsRecords.map((record, index) => (
                        <div
                          key={`${record.type}-${record.name}-${index}`}
                          className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border/60 pt-2 first:border-0 first:pt-0"
                        >
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{record.type}</span>
                          <span className="text-muted-foreground">Name</span>
                          <span className="break-all font-medium">
                            {record.name}
                          </span>
                          <span className="text-muted-foreground">Value</span>
                          <span className="break-all font-medium text-primary">
                            {record.value}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">CNAME</span>
                        <span className="text-muted-foreground">Name</span>
                        <span className="break-all font-medium">
                          {customDomain.domain}
                        </span>
                        <span className="text-muted-foreground">Value</span>
                        <span className="break-all font-medium text-primary">
                          {customDomain.cnameValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {customDomain.status === "FAILED" && (
              <Alert variant="destructive">
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>
                  DNS verification or SSL certificate issuance failed. Please
                  verify your DNS records and try removing and re-connecting the
                  domain.
                </AlertDescription>
              </Alert>
            )}

            {customDomain.status === "ACTIVE" && (
              <div className="flex items-center gap-2 text-sm text-status-operational">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  Your status page is live at{" "}
                  <a
                    href={`https://${customDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 hover:opacity-80"
                  >
                    https://{customDomain.domain}
                  </a>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
