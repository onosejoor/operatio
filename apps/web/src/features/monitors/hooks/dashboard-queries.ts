"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncidents, getMonitors } from "../api/monitors";

export const monitorKeys = {
  all: ["monitors"] as const,
  list: (organizationId: string) => ["monitors", organizationId] as const,
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
