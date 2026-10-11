"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMonitor,
  getIncidents,
  getMonitor,
  getMonitorChecks,
  getMonitorStats,
  getMonitors,
  type CreateMonitorInput,
  type MonitorCheckSort,
  type MonitorSummary,
  type UpdateMonitorInput,
  updateMonitor,
  updateIncidentStatus,
  IncidentStatus,
} from "../api/monitors";

export const monitorKeys = {
  all: ["monitors"] as const,
  list: (organizationId: string) => ["monitors", organizationId] as const,
  detail: (organizationId: string, monitorId: string) =>
    ["monitors", organizationId, monitorId] as const,
  checks: (
    organizationId: string,
    monitorId: string,
    page: number,
    status?: MonitorSummary["status"],
    sort?: MonitorCheckSort,
    fromDate?: string,
  ) =>
    [
      "monitors",
      organizationId,
      monitorId,
      "checks",
      page,
      status,
      sort,
      fromDate,
    ] as const,
  stats: (organizationId: string, monitorId: string) =>
    ["monitors", organizationId, monitorId, "stats"] as const,
  incidents: (organizationId: string) => ["incidents", organizationId] as const,
};

export function useMonitors(organizationId?: string) {
  return useQuery({
    queryKey: monitorKeys.list(organizationId ?? ""),
    queryFn: () => getMonitors(organizationId!),
    enabled: !!organizationId,
  });
}

export function useOrganizationIncidents(organizationId?: string) {
  return useQuery({
    queryKey: monitorKeys.incidents(organizationId ?? ""),
    queryFn: () => getIncidents(organizationId!),
    enabled: !!organizationId,
  });
}

export function useMonitor(organizationId?: string, monitorId?: string) {
  return useQuery({
    queryKey: monitorKeys.detail(organizationId ?? "", monitorId ?? ""),
    queryFn: () => getMonitor(organizationId!, monitorId!),
    enabled: !!organizationId && !!monitorId,
  });
}

export function useMonitorChecks(
  organizationId?: string,
  monitorId?: string,
  page = 1,
  status?: MonitorSummary["status"],
  sort: MonitorCheckSort = "newest",
  fromDate?: string,
) {
  return useQuery({
    queryKey: monitorKeys.checks(
      organizationId ?? "",
      monitorId ?? "",
      page,
      status,
      sort,
      fromDate,
    ),
    queryFn: () =>
      getMonitorChecks(
        organizationId!,
        monitorId!,
        page,
        10,
        status,
        sort,
        fromDate,
      ),
    enabled: !!organizationId && !!monitorId,
  });
}

export function useUpdateMonitor(organizationId: string, monitorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMonitorInput) =>
      updateMonitor(organizationId, monitorId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: monitorKeys.list(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: monitorKeys.detail(organizationId, monitorId),
        }),
        queryClient.invalidateQueries({
          queryKey: monitorKeys.stats(organizationId, monitorId),
        }),
      ]);
    },
  });
}

export function useMonitorStats(organizationId?: string, monitorId?: string) {
  return useQuery({
    queryKey: monitorKeys.stats(organizationId ?? "", monitorId ?? ""),
    queryFn: () => getMonitorStats(organizationId!, monitorId!),
    enabled: !!organizationId && !!monitorId,
  });
}

export function useCreateMonitor(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMonitorInput) =>
      createMonitor(organizationId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: monitorKeys.list(organizationId),
      }),
  });
}

export function useUpdateIncidentStatus(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentId,
      status,
      message,
    }: {
      incidentId: string;
      status: IncidentStatus;
      message?: string;
    }) => updateIncidentStatus(organizationId, incidentId, { status, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: monitorKeys.incidents(organizationId),
      });
    },
  });
}
