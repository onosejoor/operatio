import { OverallStatus } from "../types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";

export function OverallStatusBanner({ status }: { status: OverallStatus }) {
  const config = overallStatusConfig[status];

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${
        status === OverallStatus.OPERATIONAL
          ? "border-status-operational/20 bg-status-operational/5"
          : status === OverallStatus.MAJOR_OUTAGE
            ? "border-status-outage/20 bg-status-outage/5"
            : "border-border bg-muted/50"
      }`}
    >
      <StatusDot className={config.dotClass} pulse={status !== OverallStatus.OPERATIONAL} />
      <h1 className="text-lg font-semibold">{config.label}</h1>
    </div>
  );
}
