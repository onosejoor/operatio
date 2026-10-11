import { apiFetch } from "@app/lib/api/client";
import type { ApiResponse } from "@app/lib/types";

export interface StatusPageSummary {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  description: string | null;
  logo: string | null;
  brandColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusPageInput {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isPublic: boolean;
  brandColor: string;
}

export interface StatusPageMonitor {
  id: string;
  statusPageId: string;
  monitorId: string;
  order: number;
  monitor: {
    id: string;
    name: string;
    url: string;
    status: "UP" | "DOWN" | "PENDING";
    isActive: boolean;
    isPublic: boolean;
  };
}

export function getStatusPages(organizationId: string) {
  return apiFetch<ApiResponse<StatusPageSummary[]>>(
    `/organizations/${organizationId}/status-pages`,
  ).then((response) => response.data ?? []);
}

export function getStatusPage(organizationId: string, statusPageId: string) {
  return apiFetch<ApiResponse<StatusPageSummary>>(
    `/organizations/${organizationId}/status-pages/${statusPageId}`,
  ).then((response) => {
    if (!response.data) throw new Error("The status page could not be loaded.");
    return response.data;
  });
}

export function getStatusPageMonitors(
  organizationId: string,
  statusPageId: string,
) {
  return apiFetch<ApiResponse<StatusPageMonitor[]>>(
    `/organizations/${organizationId}/status-pages/${statusPageId}/monitors`,
  ).then((response) => response.data ?? []);
}

export function addStatusPageMonitor(
  organizationId: string,
  statusPageId: string,
  monitorId: string,
  order: number,
) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/status-pages/${statusPageId}/monitors`,
    { method: "POST", body: JSON.stringify({ monitorId, order }) },
  );
}

export function removeStatusPageMonitor(
  organizationId: string,
  statusPageId: string,
  monitorId: string,
) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/status-pages/${statusPageId}/monitors/${monitorId}`,
    { method: "DELETE" },
  );
}

export function createStatusPage(
  organizationId: string,
  input: StatusPageInput,
) {
  return apiFetch<ApiResponse<string>>(
    `/organizations/${organizationId}/status-pages`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateStatusPage(
  organizationId: string,
  statusPageId: string,
  input: Partial<StatusPageInput>,
) {
  return apiFetch<ApiResponse<{ id: string }>>(
    `/organizations/${organizationId}/status-pages/${statusPageId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}
