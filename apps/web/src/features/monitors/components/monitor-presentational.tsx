import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@operatio/ui/components/ui/card";
import type { Column } from "@operatio/ui/components/resource-view";
import { cn } from "@operatio/ui/lib/utils";
import type { MonitorSummary } from "../api/monitors";

const statusConfig: Record<
  MonitorSummary["status"],
  { label: string; badge: string; dot: string; tone: string }
> = {
  UP: {
    label: "Operational",
    badge: "bg-status-operational-muted text-status-operational-text",
    dot: "bg-status-operational",
    tone: "text-status-operational-text",
  },
  DOWN: {
    label: "Down",
    badge: "bg-status-outage-muted text-status-outage-text",
    dot: "bg-status-outage",
    tone: "text-status-outage-text",
  },
  PENDING: {
    label: "Pending",
    badge: "bg-status-paused-muted text-status-paused-text",
    dot: "bg-status-paused",
    tone: "text-foreground",
  },
};

export function MonitorStatusBadge({
  status,
}: {
  status: MonitorSummary["status"];
}) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.badge,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          config.dot,
          status === "DOWN" && "status-pulse",
        )}
      />
      {config.label}
    </span>
  );
}

export function checkedAgo(value: string | null) {
  if (!value) return "Not checked yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last check time unavailable";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function responseLabel(monitor: MonitorSummary) {
  return monitor.lastResponseTimeMs === null
    ? "No data"
    : `${monitor.lastResponseTimeMs.toLocaleString()} ms`;
}

const SLOW_MS = 1000;
const VERY_SLOW_MS = 2000;
const MAX_MS = 3000;

function latencyTone(ms: number) {
  if (ms >= VERY_SLOW_MS)
    return { text: "text-status-outage-text", bar: "bg-status-outage" };
  if (ms >= SLOW_MS)
    return { text: "text-status-degraded-text", bar: "bg-status-degraded" };
  return { text: "text-foreground", bar: "bg-status-operational" };
}

export function MonitorResponseCell({ monitor }: { monitor: MonitorSummary }) {
  const ms = monitor.lastResponseTimeMs;
  const http = monitor.lastStatusCode;
  if (ms === null) {
    return <span className="text-sm text-muted-foreground">No data</span>;
  }

  const tone = latencyTone(ms);
  const isError = http !== null && http >= 400;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0">
        <span
          className={cn(
            "font-mono text-sm font-medium tabular-nums",
            tone.text,
          )}
        >
          {ms.toLocaleString()} ms
        </span>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            aria-hidden="true"
            className={cn("h-full rounded-full", tone.bar)}
            style={{ width: `${Math.min(ms / MAX_MS, 1) * 100}%` }}
          />
        </div>
      </div>
      {http !== null && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-xs",
            isError
              ? "bg-status-outage-muted text-status-outage-text"
              : "bg-muted text-muted-foreground",
          )}
        >
          {http}
        </span>
      )}
    </div>
  );
}

export const monitorColumns: Column<MonitorSummary>[] = [
  {
    header: "Monitor",
    className: "pl-6",
    cell: (monitor) => (
      <div className="max-w-0 sm:max-w-xs">
        <div className="truncate font-medium">{monitor.name}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          {monitor.url}
        </div>
        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
          {responseLabel(monitor)} · {checkedAgo(monitor.lastCheckedAt)}
        </div>
      </div>
    ),
  },
  {
    header: "Status",
    cell: (monitor) => <MonitorStatusBadge status={monitor.status} />,
  },
  {
    header: "Response",
    className: "hidden sm:table-cell",
    cell: (monitor) => <MonitorResponseCell monitor={monitor} />,
  },
  {
    header: "Last checked",
    className:
      "hidden pr-6 text-right font-mono text-muted-foreground md:table-cell",
    cell: (monitor) => checkedAgo(monitor.lastCheckedAt),
  },
];

export function MonitorSummaryCard({ monitor }: { monitor: MonitorSummary }) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="space-y-1.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-base font-semibold">
            {monitor.name}
          </CardTitle>
          <MonitorStatusBadge status={monitor.status} />
        </div>
        <CardDescription className="truncate font-mono text-xs">
          {monitor.url}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">
          {responseLabel(monitor)}
          {monitor.lastStatusCode !== null && (
            <span className="ml-1 text-muted-foreground/80">
              ({monitor.lastStatusCode})
            </span>
          )}
        </span>
        <span className="font-mono">{checkedAgo(monitor.lastCheckedAt)}</span>
      </CardFooter>
    </Card>
  );
}
