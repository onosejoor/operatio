"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStatusPage,
  addStatusPageMonitor,
  getStatusPage,
  getStatusPageMonitors,
  getStatusPages,
  removeStatusPageMonitor,
  updateStatusPage,
  type StatusPageInput,
} from "../api/status-pages";

export const statusPageKeys = {
  list: (organizationId: string) => ["status-pages", organizationId] as const,
  detail: (organizationId: string, statusPageId: string) =>
    ["status-pages", organizationId, statusPageId] as const,
  monitors: (organizationId: string, statusPageId: string) =>
    ["status-pages", organizationId, statusPageId, "monitors"] as const,
};

export function useStatusPages(organizationId?: string) {
  return useQuery({
    queryKey: statusPageKeys.list(organizationId ?? ""),
    queryFn: () => getStatusPages(organizationId!),
    enabled: !!organizationId,
  });
}

export function useStatusPage(organizationId?: string, statusPageId?: string) {
  return useQuery({
    queryKey: statusPageKeys.detail(organizationId ?? "", statusPageId ?? ""),
    queryFn: () => getStatusPage(organizationId!, statusPageId!),
    enabled: !!organizationId && !!statusPageId,
  });
}

export function useStatusPageMonitors(
  organizationId?: string,
  statusPageId?: string,
) {
  return useQuery({
    queryKey: statusPageKeys.monitors(organizationId ?? "", statusPageId ?? ""),
    queryFn: () => getStatusPageMonitors(organizationId!, statusPageId!),
    enabled: !!organizationId && !!statusPageId,
  });
}

export function useCreateStatusPage(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StatusPageInput) =>
      createStatusPage(organizationId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: statusPageKeys.list(organizationId),
      }),
  });
}

export function useUpdateStatusPage(
  organizationId: string,
  statusPageId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<StatusPageInput>) =>
      updateStatusPage(organizationId, statusPageId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: statusPageKeys.list(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: statusPageKeys.detail(organizationId, statusPageId),
        }),
      ]);
    },
  });
}

export function useAddStatusPageMonitor(
  organizationId: string,
  statusPageId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ monitorId, order }: { monitorId: string; order: number }) =>
      addStatusPageMonitor(organizationId, statusPageId, monitorId, order),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: statusPageKeys.monitors(organizationId, statusPageId),
      });
    },
  });
}

export function useRemoveStatusPageMonitor(
  organizationId: string,
  statusPageId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (monitorId: string) =>
      removeStatusPageMonitor(organizationId, statusPageId, monitorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: statusPageKeys.monitors(organizationId, statusPageId),
      });
    },
  });
}
