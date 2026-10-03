"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authKeys,
} from "@app/features/auth/hooks/auth-queries";
import {
  updateOrganization,
  updateProfile,
  type AuthUser,
  type Organization,
} from "@app/features/auth/api/auth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name }: { name: string }) => updateProfile(name.trim()),
    onSuccess: (profile) => {
      queryClient.setQueryData<AuthUser>(authKeys.user, (current) =>
        current ? { ...current, name: profile.name } : current,
      );
    },
  });
}

export function useUpdateOrganization(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      updateOrganization(organizationId, name.trim()),
    onSuccess: async (updated) => {
      queryClient.setQueryData<Organization[]>(
        authKeys.organizations,
        (current) =>
          current?.map((item) => (item.id === updated.id ? updated : item)),
      );
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });
}
