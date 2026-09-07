import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicStatus } from '../public-status';

describe('getPublicStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as any;

    const result = await getPublicStatus('test');

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/public/status/test'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('throws error for 404 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;

    await expect(getPublicStatus('nonexistent')).rejects.toThrow('Status page not found');
  });

  it('throws error for other failed responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as any;

    await expect(getPublicStatus('test')).rejects.toThrow('Failed to fetch status page');
  });

  it('uses correct API base URL from environment', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    
    const mockData = {
      statusPage: {
        name: 'Test Status',
        slug: 'test',
      },
      status: 'operational' as const,
      monitors: [],
      incidents: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as any;

    await getPublicStatus('test');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/public/status/test',
      expect.objectContaining({ cache: 'no-store' })
    );
  });
});
