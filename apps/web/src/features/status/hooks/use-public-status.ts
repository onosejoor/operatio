import { useQuery } from '@tanstack/react-query'
import { getPublicStatus, getPublicStatusMetrics } from '../api/public-status'
import type { PublicStatusResponse, MetricsResponse } from '../types/public-status'

export const statusKeys = {
  all: ['status'] as const,
  public: (slug: string) => [...statusKeys.all, 'public', slug] as const,
  metrics: (slug: string) => [...statusKeys.all, 'metrics', slug] as const,
}

export function usePublicStatus(
  slug: string,
  initialData?: PublicStatusResponse,
) {
  return useQuery<PublicStatusResponse>({
    queryKey: statusKeys.public(slug),
    queryFn: () => getPublicStatus(slug),
    enabled: !!slug,
    initialData,
    retry: false,
  })
}

export function usePublicStatusMetrics(
  slug: string,
  initialData?: MetricsResponse,
) {
  return useQuery<MetricsResponse>({
    queryKey: statusKeys.metrics(slug),
    queryFn: () => getPublicStatusMetrics(slug),
    enabled: !!slug,
    initialData,
    retry: false,
    refetchInterval: 60000, // Refresh metrics every minute
  })
}
