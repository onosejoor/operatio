import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPublicStatus } from '../public-status'
import { apiFetch } from '@app/lib/api/client'

// Mock the shared API client
vi.mock('@/lib/api/client')

describe('getPublicStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches public status data successfully', async () => {
    const mockData = {
      statusPage: {
        name: 'Test Status',
        slug: 'test',
        description: 'Test description',
      },
      status: 'operational' as const,
      monitors: [],
      incidents: [],
    }

    vi.mocked(apiFetch).mockResolvedValueOnce(mockData)

    const result = await getPublicStatus('test')

    expect(result).toEqual(mockData)
    expect(apiFetch).toHaveBeenCalledWith('/public/status/test')
  })

  it('throws NotFoundError on 404', async () => {
    const { NotFoundError } = await import('@app/lib/api/client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new NotFoundError('Status page not found'))

    await expect(getPublicStatus('nonexistent')).rejects.toThrow('Status page not found')
  })

  it('throws ApiError on other failed responses', async () => {
    const { ApiError } = await import('@app/lib/api/client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiError('Failed to fetch status page', 500))

    await expect(getPublicStatus('test')).rejects.toThrow('Failed to fetch status page')
  })

  it('throws NetworkError on network failure', async () => {
    const { NetworkError } = await import('@app/lib/api/client')
    vi.mocked(apiFetch).mockRejectedValueOnce(new NetworkError('Network error'))

    await expect(getPublicStatus('test')).rejects.toThrow('Network error')
  })
})
