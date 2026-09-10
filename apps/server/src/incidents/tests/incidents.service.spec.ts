import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from '../incidents.service';
import { PrismaService } from '../../database/database.service';

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
    },
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

  describe('getIncidentsForMonitor', () => {
    it('returns paginated incidents for a monitor', async () => {
      const incidents = [
        {
          id: 'incident-1',
          monitorId: 'monitor-1',
          organizationId: 'org-1',
          detectedAt: new Date('2024-01-01'),
          resolvedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];
      prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-1' });
      prisma.incident.findMany.mockResolvedValue(incidents);
      prisma.incident.count.mockResolvedValue(1);

      const result = await service.getIncidentsForMonitor('org-1', 'monitor-1', 1, 50);

      expect(result).toEqual({
        data: incidents,
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });
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
        service.getIncidentsForMonitor('org-1', 'monitor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getIncidentsForOrganization', () => {
    it('returns paginated incidents for an organization', async () => {
      const incidents = [
        {
          id: 'incident-1',
          monitorId: 'monitor-1',
          organizationId: 'org-1',
          detectedAt: new Date('2024-01-01'),
          resolvedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];
      prisma.incident.findMany.mockResolvedValue(incidents);
      prisma.incident.count.mockResolvedValue(1);

      const result = await service.getIncidentsForOrganization('org-1', 1, 50);

      expect(result).toEqual({
        data: incidents,
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });
    });
  });

  describe('getIncidentById', () => {
    it('returns an incident when it belongs to the organization', async () => {
      const incident = {
        id: 'incident-1',
        monitorId: 'monitor-1',
        organizationId: 'org-1',
        detectedAt: new Date('2024-01-01'),
        resolvedAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      prisma.incident.findFirst.mockResolvedValue(incident);

      const result = await service.getIncidentById('org-1', 'incident-1');

      expect(result).toEqual(incident);
    });

    it('throws NotFoundException when incident does not exist', async () => {
      prisma.incident.findFirst.mockResolvedValue(null);

      await expect(
        service.getIncidentById('org-1', 'incident-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when incident belongs to different organization', async () => {
      prisma.incident.findFirst.mockResolvedValue(null);

      await expect(
        service.getIncidentById('org-1', 'incident-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
