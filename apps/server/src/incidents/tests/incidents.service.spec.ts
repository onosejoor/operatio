import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from '../incidents.service';
import { PrismaService } from '../../database/database.service';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

describe('IncidentsService', () => {
  let service: IncidentsService;
  const prisma = {
    monitor: {
      findFirst: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    incidentEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDbIncident = {
    id: 'incident-1',
    monitorId: 'monitor-1',
    organizationId: 'org-1',
    publicId: 'pub-1',
    title: 'Monitor down',
    status: IncidentStatus.INVESTIGATING,
    severity: IncidentSeverity.MAJOR,
    publicMessage: 'Investigating issue',
    detectedAt: new Date('2024-01-01T00:00:00.000Z'),
    resolvedAt: new Date('2024-01-02T00:00:00.000Z'),
    durationMs: 86400000,
    isInternal: false,
    isCustom: false,
    monitor: { name: 'API Server' },
    events: [
      {
        type: 'STATUS_UPDATE',
        status: IncidentStatus.INVESTIGATING,
        message: 'Investigating',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ],
  };

  describe('getIncidentsForMonitor', () => {
    it('returns paginated incidents for a monitor', async () => {
      prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-1' });
      prisma.incident.findMany.mockResolvedValue([mockDbIncident]);
      prisma.incident.count.mockResolvedValue(1);

      const result = await service.getIncidentsForMonitor(
        'org-1',
        'monitor-1',
        1,
        50,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('incident-1');
      expect(result.data[0].monitorName).toBe('API Server');
      expect(result.meta.total).toBe(1);
    });

    it('throws NotFoundException when monitor does not exist', async () => {
      prisma.monitor.findFirst.mockResolvedValue(null);

      await expect(
        service.getIncidentsForMonitor('org-1', 'monitor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when monitor belongs to different organization', async () => {
      prisma.monitor.findFirst.mockResolvedValue(null);

      await expect(
        service.getIncidentsForMonitor('other-org', 'monitor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getIncidentsForOrganization', () => {
    it('returns paginated incidents for an organization', async () => {
      prisma.incident.findMany.mockResolvedValue([mockDbIncident]);
      prisma.incident.count.mockResolvedValue(1);

      const result = await service.getIncidentsForOrganization('org-1', 1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('incident-1');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getIncidentById', () => {
    it('returns an incident when it belongs to the organization', async () => {
      prisma.incident.findFirst.mockResolvedValue(mockDbIncident);

      const result = await service.getIncidentById('org-1', 'incident-1');

      expect(result.id).toBe('incident-1');
      expect(result.monitorName).toBe('API Server');
    });

    it('throws NotFoundException when incident does not exist', async () => {
      prisma.incident.findFirst.mockResolvedValue(null);

      await expect(
        service.getIncidentById('org-1', 'incident-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createCustomIncident', () => {
    it('creates a custom internal incident without monitor', async () => {
      const mockCreated = {
        ...mockDbIncident,
        monitorId: null,
        monitor: null,
        isInternal: true,
        isCustom: true,
        title: 'Slow indexing job',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          incident: {
            create: jest.fn().mockResolvedValue({ id: 'incident-custom-1' }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(mockCreated),
          },
          incidentEvent: {
            create: jest.fn().mockResolvedValue({ id: 'event-1' }),
          },
        });
      });

      const result = await service.createCustomIncident('org-1', {
        title: 'Slow indexing job',
        message: 'Elasticsearch sync is delayed',
        severity: IncidentSeverity.MINOR,
        status: IncidentStatus.INVESTIGATING,
        isInternal: true,
      });

      expect(result.message).toBe('Incident created successfully');
    });
  });
});
