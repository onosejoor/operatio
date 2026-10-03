import { apiFetch } from "@app/lib/api/client";
import type { ApiResponse } from "@app/lib/types";

export interface AuthUser {
  name: string;
  email: string;
  emailVerified: boolean;
  memberships: Array<{
    id: string;
    role: "OWNER" | "MEMBER";
    organization: { id: string; name: string };
  }>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function getCurrentUser() {
  return apiFetch<ApiResponse<AuthUser>>("/auth/me").then((response) => {
    if (!response.data) throw new Error("Could not load your account.");
    return response.data;
  });
}

export function getOrganizations() {
  return apiFetch<ApiResponse<Organization[]>>("/organizations").then(
    (response) => response.data ?? [],
  );
}

export function updateProfile(name: string) {
  return apiFetch<
    ApiResponse<Pick<AuthUser, "name" | "email" | "emailVerified">>
  >("/auth/me", { method: "PATCH", body: JSON.stringify({ name }) }).then(
    (response) => {
      if (!response.data) throw new Error("Could not update your profile.");
      return response.data;
    },
  );
}

export function updateOrganization(organizationId: string, name: string) {
  return apiFetch<ApiResponse<Organization>>(
    `/organizations/${organizationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ name }),
    },
  ).then((response) => {
    if (!response.data) throw new Error("Could not update the workspace.");
    return response.data;
  });
}

export function signIn(input: { email: string; password: string }) {
  return apiFetch<ApiResponse<{ memberships: unknown[] }>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signUp(input: {
  name: string;
  email: string;
  password: string;
}) {
  return apiFetch<ApiResponse<{ message: string }>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string) {
  return apiFetch<ApiResponse<void>>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return apiFetch<ApiResponse<{ message: string }>>(
    "/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export function signOut() {
  return apiFetch<ApiResponse<void>>("/auth/logout", { method: "POST" });
}
