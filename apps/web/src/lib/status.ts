import { MonitorPerformanceStatus, OverallStatus } from "@app/features/status/types/public-status";

export const overallStatusConfig: Record<
  OverallStatus,
  { label: string; dotClass: string; badgeClass: string; textClass: string }
> = {
  [OverallStatus.OPERATIONAL]: {
    label: "All Systems Operational",
    dotClass: "bg-status-operational",
    badgeClass: "bg-status-operational/10 text-status-operational",
    textClass: "text-status-operational",
  },
  [OverallStatus.DEGRADED]: {
    label: "Degraded Performance",
    dotClass: "bg-status-degraded",
    badgeClass: "bg-status-degraded/10 text-status-degraded",
    textClass: "text-status-degraded",
  },
  [OverallStatus.MAJOR_OUTAGE]: {
    label: "Major Outage",
    dotClass: "bg-status-outage",
    badgeClass: "bg-status-outage/10 text-status-outage",
    textClass: "text-status-outage",
  },
};

export const monitorStatusConfig: Record<
  MonitorPerformanceStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  [MonitorPerformanceStatus.UP]: {
    label: "Operational",
    dotClass: "bg-status-operational",
    textClass: "text-status-operational",
  },
  [MonitorPerformanceStatus.SLOW]: {
    label: "Degraded",
    dotClass: "bg-status-degraded",
    textClass: "text-status-degraded",
  },
  [MonitorPerformanceStatus.DOWN]: {
    label: "Down",
    dotClass: "bg-status-outage",
    textClass: "text-status-outage",
  },
  [MonitorPerformanceStatus.PENDING]: {
    label: "Pending",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
  },
};

export function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
