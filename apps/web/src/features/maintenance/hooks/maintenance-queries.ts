"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelMaintenanceWindow,
  createMaintenanceWindow,
  getMaintenanceWindows,
  updateMaintenanceWindow,
  type MaintenanceWindowInput,
} from "../api/maintenance";

export const maintenanceKeys = {
  list: (organizationId: string) =>
    ["maintenance-windows", organizationId] as const,
};

export function useMaintenanceWindows(organizationId?: string) {
  return useQuery({
    queryKey: maintenanceKeys.list(organizationId ?? ""),
    queryFn: () => getMaintenanceWindows(organizationId!),
    enabled: !!organizationId,
  });
}

export function useCreateMaintenanceWindow(organizationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MaintenanceWindowInput) =>
      createMaintenanceWindow(organizationId, input),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: maintenanceKeys.list(organizationId),
      }),
  });
}

export function useUpdateMaintenanceWindow(organizationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<MaintenanceWindowInput>;
    }) => updateMaintenanceWindow(organizationId, id, input),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: maintenanceKeys.list(organizationId),
      }),
  });
}

export function useCancelMaintenanceWindow(organizationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelMaintenanceWindow(organizationId, id),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: maintenanceKeys.list(organizationId),
      }),
  });
}
