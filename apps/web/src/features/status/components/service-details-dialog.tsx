"use client";

import { PublicMonitor } from "../types/public-status";
import { monitorStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { UptimeBars } from "./uptime-bars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@operatio/ui/components/ui/dialog";
import { Button } from "@operatio/ui/components/ui/button";
import { Badge } from "@operatio/ui/components/ui/badge";
import { Activity, Gauge, Globe, CheckCircle2 } from "lucide-react";

interface ServiceDetailsDialogProps {
  monitor: PublicMonitor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDetailsDialog({
  monitor,
  isOpen,
  onClose,
}: ServiceDetailsDialogProps) {
  if (!monitor) return null;

  const config = monitorStatusConfig[monitor.status];
  const isUp = monitor.status === "UP";
  const isDown = monitor.status === "DOWN";
  const isSlow = monitor.status === "SLOW";

  const badgeVariant = isUp
    ? ("operational" as const)
    : isDown
      ? ("outage" as const)
      : isSlow
        ? ("degraded" as const)
        : ("pending" as const);

  let stateExplanation = "All systems and health checks are working normally.";
  if (isDown) {
    stateExplanation =
      "This service is currently unavailable. Our team is working on resolving this.";
  } else if (isSlow) {
    stateExplanation =
      "Service is taking longer than usual to respond right now.";
  } else if (monitor.status === "PENDING") {
    stateExplanation = "Checking status for the first time...";
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                <Globe className="h-4 w-4 text-foreground/80" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  {monitor.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Live status & performance overview
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant={badgeVariant}
              className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 flex items-center gap-1.5"
            >
              <StatusDot className={config.dotClass} pulse={!isUp} />
              <span>{config.label}</span>
            </Badge>
          </div>
        </DialogHeader>

        {/* State explanation banner */}
        <div
          className={`my-3 rounded-lg border px-3.5 py-2.5 text-xs ${
            isDown
              ? "border-status-outage/30 bg-status-outage/5 text-status-outage"
              : isSlow
                ? "border-status-degraded/30 bg-status-degraded/5 text-status-degraded"
                : "border-border/40 bg-muted/20 text-muted-foreground"
          }`}
        >
          <p className="leading-relaxed">{stateExplanation}</p>
        </div>

        {/* Overview Grid */}
        <div className="space-y-4 pt-1">
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Latest check result
            </h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {/* Status */}
              <div className="rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                  <Activity className="h-3 w-3" />
                  <span>Current status</span>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {config.label}
                </div>
              </div>

              {/* HTTP Status Code */}
              {monitor.lastStatusCode != null && (
                <div className="rounded-lg border border-border/40 bg-card/40 p-3">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                    <Globe className="h-3 w-3" />
                    <span>Response code</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-foreground">
                    {monitor.lastStatusCode} {monitor.lastStatusCode === 200 ? "(OK)" : ""}
                  </div>
                </div>
              )}

              {/* Response Time */}
              {monitor.responseTime != null && (
                <div className="rounded-lg border border-border/40 bg-card/40 p-3">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                    <Gauge className="h-3 w-3" />
                    <span>Response speed</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-foreground">
                    {monitor.responseTime} ms
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reliability / Availability */}
          {monitor.uptime != null && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Uptime & Reliability
              </h4>
              <div className="rounded-lg border border-border/40 bg-card/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-status-operational" />
                  <div>
                    <div className="text-xs font-medium text-foreground">
                      90-Day Uptime
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Percentage of successful checks over the past 90 days
                    </div>
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-foreground">
                  {monitor.uptime.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Compact 90-Day History */}
          {monitor.dailyUptime && monitor.dailyUptime.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                90-day history
              </h4>
              <div className="rounded-lg border border-border/40 bg-card/40 p-4">
                <UptimeBars data={monitor.dailyUptime} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/40 sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
