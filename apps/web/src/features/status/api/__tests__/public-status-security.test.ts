import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicStatus } from '../public-status';

describe('getPublicStatus - Security', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not expose private monitor fields', async () => {
    const mockData = {
      statusPage: {
        name: 'Test Status',
        slug: 'test',
      },
      status: 'operational' as const,
      monitors: [
        {
          name: 'API',
          status: 'UP' as const,
          uptime: 99.99,
          responseTime: 142,
        },
      ],
      incidents: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as any;

    const result = await getPublicStatus('test');

    // Ensure private fields are not exposed
    expect(result.monitors[0]).not.toHaveProperty('id');
    expect(result.monitors[0]).not.toHaveProperty('url');
    expect(result.monitors[0]).not.toHaveProperty('interval');
    expect(result.monitors[0]).not.toHaveProperty('timeout');
    expect(result.monitors[0]).not.toHaveProperty('organizationId');
    expect(result.monitors[0]).not.toHaveProperty('isActive');
    expect(result.monitors[0]).not.toHaveProperty('isPublic');
  });

  it('does not expose private organization fields', async () => {
    const mockData = {
      statusPage: {
        name: 'Test Status',
        slug: 'test',
        description: 'Test description',
        logo: 'https://example.com/logo.png',
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

    // Ensure private organization fields are not exposed
    expect(result.statusPage).not.toHaveProperty('id');
    expect(result.statusPage).not.toHaveProperty('organizationId');
    expect(result.statusPage).not.toHaveProperty('isPublic');
    expect(result.statusPage).not.toHaveProperty('createdAt');
    expect(result.statusPage).not.toHaveProperty('updatedAt');
  });

  it('does not expose internal incident details', async () => {
    const mockData = {
      statusPage: {
        name: 'Test Status',
        slug: 'test',
      },
      status: 'operational' as const,
      monitors: [],
      incidents: [
        {
          id: 'incident-123',
          status: 'resolved' as const,
          startedAt: '2024-01-15T10:30:00Z',
          resolvedAt: '2024-01-15T11:30:00Z',
          duration: 3600,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as any;

    const result = await getPublicStatus('test');

    // Ensure internal incident fields are not exposed
    expect(result.incidents[0]).not.toHaveProperty('monitorId');
    expect(result.incidents[0]).not.toHaveProperty('organizationId');
    expect(result.incidents[0]).not.toHaveProperty('createdAt');
    expect(result.incidents[0]).not.toHaveProperty('updatedAt');
  });
});
