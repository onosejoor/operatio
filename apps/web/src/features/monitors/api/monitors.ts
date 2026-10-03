import { apiFetch } from "@app/lib/api/client";
import type { ApiResponse } from "@app/lib/types";
import type { PublicIncident } from "@app/features/status/types/public-status";

export interface MonitorSummary {
  id: string;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "PENDING";
  interval: number;
  isActive: boolean;
  isPublic: boolean;
  lastCheckedAt: string | null;
  lastStatusCode: number | null;
  lastResponseTimeMs: number | null;
}

export interface MonitorDetail extends MonitorSummary {
  timeout: number;
  nextCheckAt: string | null;
}

export interface MonitorCheck {
  id: string;
  status: MonitorSummary["status"];
  statusCode: number | null;
  responseTimeMs: number;
  checkedAt: string;
  error: string | null;
}

export interface MonitorChecksPage {
  checks: MonitorCheck[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface MonitorStats {
  checkSuccessRate: number;
  averageResponseTime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  latestStatus: MonitorSummary["status"];
  dailyUptime: Array<{
    date: string;
    uptimePercentage: number | null;
    downDurationMinutes: number;
    failureCount: number;
  }>;
}

export interface CreateMonitorInput {
  name: string;
  url: string;
  interval: number;
  timeout: number;
  isPublic: boolean;
}

export interface UpdateMonitorInput extends Partial<CreateMonitorInput> {
  isActive?: boolean;
}

export type MonitorCheckSort = "newest" | "oldest" | "slowest";
export type MonitorCheckStatus = MonitorSummary["status"];

export interface IncidentSummary extends PublicIncident {
  monitorId: string;
  organizationId: string;
  monitorName: string;
}

export function getMonitors(organizationId: string) {
  return apiFetch<ApiResponse<MonitorSummary[]>>(
    `/organizations/${organizationId}/monitors`,
  ).then((response) => response.data ?? []);
}

export function getMonitor(organizationId: string, monitorId: string) {
  return apiFetch<ApiResponse<MonitorDetail>>(
    `/organizations/${organizationId}/monitors/${monitorId}`,
  ).then((response) => {
    if (!response.data) throw new Error("The monitor could not be loaded.");
    return response.data;
  });
}

export function getMonitorChecks(
  organizationId: string,
  monitorId: string,
  page = 1,
  limit = 10,
  status?: MonitorSummary["status"],
  sort: MonitorCheckSort = "newest",
  fromDate?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  });
  if (status) params.set("status", status);
  if (fromDate) params.set("fromDate", fromDate);

  return apiFetch<ApiResponse<MonitorChecksPage>>(
    `/organizations/${organizationId}/monitors/${monitorId}/checks?${params}`,
  ).then((response) => {
    if (!response.data) throw new Error("Monitor history could not be loaded.");
    return response.data;
  });
}

export function updateMonitor(
  organizationId: string,
  monitorId: string,
  input: UpdateMonitorInput,
) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/monitors/${monitorId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function getMonitorStats(organizationId: string, monitorId: string) {
  return apiFetch<ApiResponse<MonitorStats>>(
    `/organizations/${organizationId}/monitors/${monitorId}/stats`,
  ).then((response) => {
    if (!response.data) throw new Error("Monitor statistics could not be loaded.");
    return response.data;
  });
}

export function createMonitor(
  organizationId: string,
  input: CreateMonitorInput,
) {
  return apiFetch<ApiResponse<{ id: string }>>(
    `/organizations/${organizationId}/monitors`,
    { method: "POST", body: JSON.stringify(input) },
  ).then((response) => {
    if (!response.data) throw new Error("The monitor could not be created.");
    return response.data;
  });
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
