import { apiFetch } from "@app/lib/api/client";
import type { ApiResponse } from "@app/lib/types";

export interface MonitorSummary {
  id: string;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "PENDING";
  interval: number;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastStatusCode: number | null;
  lastResponseTimeMs: number | null;
}

export interface IncidentSummary {
  id: string;
  monitorId: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export function getMonitors(organizationId: string) {
  return apiFetch<ApiResponse<MonitorSummary[]>>(
    `/organizations/${organizationId}/monitors`,
  ).then((response) => response.data ?? []);
}

export function getIncidents(organizationId: string) {
  const loadPage = (page: number) =>
    apiFetch<
      ApiResponse<{ data: IncidentSummary[]; meta: { totalPages: number } }>
    >(`/organizations/${organizationId}/incidents?page=${page}&limit=100`).then(
      (response) => response.data,
    );

  return loadPage(1).then(async (firstPage) => {
    if (!firstPage) return [];
    if (firstPage.meta.totalPages <= 1) return firstPage.data;
    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
        loadPage(index + 2),
      ),
    );
    return firstPage.data.concat(
      ...remainingPages.map((page) => page?.data ?? []),
    );
  });
}
