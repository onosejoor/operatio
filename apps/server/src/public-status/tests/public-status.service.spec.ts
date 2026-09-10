import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MonitorStatus } from '@prisma/client';
import { PublicStatusService } from '../public-status.service';
import { PrismaService } from '../../database/database.service';
import { OverallStatus, MonitorPerformanceStatus } from '../dto/public-status.dto';

describe('PublicStatusService', () => {
  let service: PublicStatusService;
  const prisma = {
    statusPage: {
      findUnique: jest.fn(),
    },
    statusPageMonitor: {
      findMany: jest.fn(),
    },
    monitor: {
      findMany: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
    },
    monitorCheck: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicStatusService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PublicStatusService>(PublicStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicStatus', () => {
    it('returns public status page when it exists and is public', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        description: 'Current operational status',
        logo: 'https://example.com/logo.png',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 142,
            isPublic: true,
            isActive: true,
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

      const result = await service.getPublicStatus('acme');

      expect(result.statusPage).toEqual({
        name: 'Acme Status',
        slug: 'acme',
        description: 'Current operational status',
        logo: 'https://example.com/logo.png',
      });
      expect(result.status).toBe(OverallStatus.OPERATIONAL);
      expect(result.monitors).toHaveLength(1);
      expect(result.incidents).toEqual([]);
    });

    it('throws NotFoundException when status page does not exist', async () => {
      prisma.statusPage.findUnique.mockResolvedValue(null);

      await expect(service.getPublicStatus('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when status page is private', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Internal Status',
        slug: 'internal',
        isPublic: false,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);

      await expect(service.getPublicStatus('internal')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('only includes monitors explicitly added to the status page', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 142,
            isPublic: true,
            isActive: true,
          },
        },
        {
          monitor: {
            id: 'monitor-2',
            name: 'Website',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 201,
            isPublic: true,
            isActive: true,
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValue(100).mockResolvedValue(99);

      const result = await service.getPublicStatus('acme');

      expect(result.monitors).toHaveLength(2);
      expect(prisma.statusPageMonitor.findMany).toHaveBeenCalledWith({
        where: { statusPageId: 'status-page-1' },
        include: {
          monitor: {
            select: {
              id: true,
              name: true,
              status: true,
              lastResponseTimeMs: true,
              isPublic: true,
              isActive: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      });
    });

    it('includes active and resolved incidents', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        { monitorId: 'monitor-1' },
        { monitorId: 'monitor-2' },
      ]);
      prisma.incident.findMany.mockResolvedValue([
        {
          id: 'incident-1',
          detectedAt: new Date('2024-01-15T10:30:00Z'),
          resolvedAt: null,
        },
        {
          id: 'incident-2',
          detectedAt: new Date('2024-01-14T10:30:00Z'),
          resolvedAt: new Date('2024-01-14T11:30:00Z'),
        },
      ]);

      const result = await service.getPublicStatus('acme');

      expect(result.incidents).toHaveLength(2);
      expect(result.incidents[0].status).toBe('active');
      expect(result.incidents[1].status).toBe('resolved');
      expect(result.incidents[1].duration).toBe(3600);
    });

    it('filters incidents to only include monitors on the status page', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        { monitorId: 'monitor-1' },
      ]);
      prisma.incident.findMany.mockResolvedValue([
        {
          id: 'incident-1',
          detectedAt: new Date('2024-01-15T10:30:00Z'),
          resolvedAt: null,
        },
      ]);

      const result = await service.getPublicStatus('acme');

      expect(prisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          monitorId: { in: ['monitor-1'] },
        },
        select: {
          id: true,
          detectedAt: true,
          resolvedAt: true,
        },
        orderBy: { detectedAt: 'desc' },
        take: 50,
      });
    });

    it('returns empty incidents when status page has no monitors', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([]);

      const result = await service.getPublicStatus('acme');

      expect(result.incidents).toEqual([]);
      expect(prisma.incident.findMany).not.toHaveBeenCalled();
    });

    it('marks monitors with slow response times as SLOW', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 4500, // 4.5 seconds - very slow
            isPublic: true,
            isActive: true,
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValue(100).mockResolvedValue(99);

      const result = await service.getPublicStatus('acme');

      expect(result.monitors[0].status).toBe('SLOW');
      expect(result.status).toBe(OverallStatus.DEGRADED);
    });

    it('filters out private monitors from status page', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 142,
            isPublic: true,
            isActive: true,
          },
        },
        {
          monitor: {
            id: 'monitor-2',
            name: 'Database',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 50,
            isPublic: false, // Private monitor
            isActive: true,
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValue(100).mockResolvedValue(99);

      const result = await service.getPublicStatus('acme');

      expect(result.monitors).toHaveLength(1);
      expect(result.monitors[0].name).toBe('API');
    });

    it('filters out inactive monitors from status page', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 142,
            isPublic: true,
            isActive: true,
          },
        },
        {
          monitor: {
            id: 'monitor-2',
            name: 'Database',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 50,
            isPublic: true,
            isActive: false, // Inactive monitor
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValue(100).mockResolvedValue(99);

      const result = await service.getPublicStatus('acme');

      expect(result.monitors).toHaveLength(1);
      expect(result.monitors[0].name).toBe('API');
    });
  });

  describe('calculateOverallStatus', () => {
    it('returns operational when all monitors are UP', () => {
      const monitors = [
        { name: 'API', status: MonitorPerformanceStatus.UP, uptime: 99.98, responseTime: 142 },
        { name: 'Website', status: MonitorPerformanceStatus.UP, uptime: 99.99, responseTime: 201 },
      ];

      const result = (service as any).calculateOverallStatus(monitors);

      expect(result).toBe(OverallStatus.OPERATIONAL);
    });

    it('returns degraded when some monitors are DOWN', () => {
      const monitors = [
        { name: 'API', status: MonitorPerformanceStatus.UP, uptime: 99.98, responseTime: 142 },
        { name: 'Website', status: MonitorPerformanceStatus.DOWN, uptime: 95.00, responseTime: 0 },
        { name: 'Database', status: MonitorPerformanceStatus.UP, uptime: 99.99, responseTime: 50 },
      ];

      const result = (service as any).calculateOverallStatus(monitors);

      expect(result).toBe(OverallStatus.DEGRADED);
    });

    it('returns degraded when some monitors are SLOW', () => {
      const monitors = [
        { name: 'API', status: MonitorPerformanceStatus.UP, uptime: 99.98, responseTime: 142 },
        { name: 'Website', status: MonitorPerformanceStatus.SLOW, uptime: 95.00, responseTime: 4500 },
        { name: 'Database', status: MonitorPerformanceStatus.UP, uptime: 99.99, responseTime: 50 },
      ];

      const result = (service as any).calculateOverallStatus(monitors);

      expect(result).toBe(OverallStatus.DEGRADED);
    });

    it('returns major_outage when all monitors are DOWN', () => {
      const monitors = [
        { name: 'API', status: MonitorPerformanceStatus.DOWN, uptime: 90.00, responseTime: 0 },
        { name: 'Website', status: MonitorPerformanceStatus.DOWN, uptime: 85.00, responseTime: 0 },
      ];

      const result = (service as any).calculateOverallStatus(monitors);

      expect(result).toBe(OverallStatus.MAJOR_OUTAGE);
    });

    it('returns operational when there are no monitors', () => {
      const result = (service as any).calculateOverallStatus([]);

      expect(result).toBe(OverallStatus.OPERATIONAL);
    });
  });

  describe('calculatePerformanceStatus', () => {
    it('returns DOWN when monitor status is DOWN', () => {
      const result = (service as any).calculatePerformanceStatus(MonitorStatus.DOWN, 100);

      expect(result).toBe(MonitorPerformanceStatus.DOWN);
    });

    it('returns PENDING when monitor status is PENDING', () => {
      const result = (service as any).calculatePerformanceStatus(MonitorStatus.PENDING, 100);

      expect(result).toBe(MonitorPerformanceStatus.PENDING);
    });

    it('returns UP when monitor is UP with fast response time', () => {
      const result = (service as any).calculatePerformanceStatus(MonitorStatus.UP, 100);

      expect(result).toBe(MonitorPerformanceStatus.UP);
    });

    it('returns SLOW when monitor is UP with slow response time (>3s)', () => {
      const result = (service as any).calculatePerformanceStatus(MonitorStatus.UP, 3500);

      expect(result).toBe(MonitorPerformanceStatus.SLOW);
    });

    it('returns UP when monitor is UP with no response time data', () => {
      const result = (service as any).calculatePerformanceStatus(MonitorStatus.UP, undefined);

      expect(result).toBe(MonitorPerformanceStatus.UP);
    });
  });

  describe('calculateUptime', () => {
    it('calculates uptime percentage correctly', async () => {
      prisma.monitorCheck.count.mockResolvedValueOnce(100).mockResolvedValueOnce(99);

      const result = await (service as any).calculateUptime('monitor-1');

      expect(result).toBe(99);
    });

    it('returns 100 when there are no checks', async () => {
      prisma.monitorCheck.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await (service as any).calculateUptime('monitor-1');

      expect(result).toBe(100);
    });
  });

  describe('security', () => {
    it('does not expose monitor URLs', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        {
          monitor: {
            id: 'monitor-1',
            name: 'API',
            status: MonitorStatus.UP,
            lastResponseTimeMs: 142,
            isPublic: true,
            isActive: true,
          },
        },
      ]);
      prisma.incident.findMany.mockResolvedValue([]);
      prisma.monitorCheck.count.mockResolvedValue(100).mockResolvedValue(99);

      const result = await service.getPublicStatus('acme');

      expect(result.monitors[0]).not.toHaveProperty('url');
      expect(result.monitors[0]).not.toHaveProperty('organizationId');
      expect(result.monitors[0]).not.toHaveProperty('id');
    });

    it('does not expose organizationId in status page', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([]);
      prisma.incident.findMany.mockResolvedValue([]);

      const result = await service.getPublicStatus('acme');

      expect(result.statusPage).not.toHaveProperty('organizationId');
      expect(result.statusPage).not.toHaveProperty('id');
    });

    it('does not expose monitorId in incidents', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
      };

      prisma.statusPage.findUnique.mockResolvedValue(statusPage);
      prisma.statusPageMonitor.findMany.mockResolvedValue([
        { monitorId: 'monitor-1' },
      ]);
      prisma.incident.findMany.mockResolvedValue([
        {
          id: 'incident-1',
          detectedAt: new Date('2024-01-15T10:30:00Z'),
          resolvedAt: null,
        },
      ]);

      const result = await service.getPublicStatus('acme');

      expect(result.incidents[0]).not.toHaveProperty('monitorId');
      expect(result.incidents[0]).not.toHaveProperty('organizationId');
    });
  });
});
