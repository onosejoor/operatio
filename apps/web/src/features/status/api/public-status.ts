import { apiFetch } from "@app/lib/api/client";
import type { PublicStatusResponse, MetricsResponse } from "../types/public-status";
import { ApiResponse } from "@app/lib/types";

export async function getPublicStatus(slug: string) {
  const response = await apiFetch<ApiResponse<PublicStatusResponse>>(
    `/public/status/${slug}`,
  );

  return response.data;
}

export async function getPublicStatusMetrics(slug: string) {
  const response = await apiFetch<ApiResponse<MetricsResponse>>(
    `/public/status/${slug}/metrics`,
  );

  return response.data;
}
