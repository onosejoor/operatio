"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, getOrganizations } from "../api/auth";

export const authKeys = {
  user: ["auth", "me"] as const,
  organizations: ["organizations"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: authKeys.organizations,
    queryFn: getOrganizations,
    enabled,
    retry: false,
  });
}
