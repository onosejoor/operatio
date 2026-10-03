import { apiFetch } from "@app/lib/api/client";
import type { ApiResponse } from "@app/lib/types";

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  statusPage: { id: string; name: string; slug: string; isPublic: boolean };
}

export interface MaintenanceWindowInput {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  statusPageId: string;
}

export function getMaintenanceWindows(organizationId: string) {
  return apiFetch<ApiResponse<MaintenanceWindow[]>>(
    `/organizations/${organizationId}/maintenance-windows`,
  ).then((response) => response.data ?? []);
}

export function createMaintenanceWindow(
  organizationId: string,
  input: MaintenanceWindowInput,
) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/maintenance-windows`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateMaintenanceWindow(
  organizationId: string,
  id: string,
  input: Partial<MaintenanceWindowInput>,
) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/maintenance-windows/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function cancelMaintenanceWindow(organizationId: string, id: string) {
  return apiFetch<ApiResponse<void>>(
    `/organizations/${organizationId}/maintenance-windows/${id}`,
    { method: "DELETE" },
  );
}
