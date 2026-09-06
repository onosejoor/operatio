import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusPagesService } from '../status-pages.service';
import { PrismaService } from '../../database/database.service';

describe('StatusPagesService', () => {
  let service: StatusPagesService;
  const prisma = {
    statusPage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusPagesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StatusPagesService>(StatusPagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a status page', async () => {
      const input = {
        name: 'Acme Status',
        slug: 'acme',
        isPublic: true,
        description: 'Current operational status',
      };
      prisma.statusPage.findUnique.mockResolvedValue(null);
      prisma.statusPage.create.mockResolvedValue({
        id: 'status-page-1',
        organizationId: 'org-1',
        ...input,
      });

      const result = await service.create('org-1', input);

      expect(result).toEqual({
        id: 'status-page-1',
        organizationId: 'org-1',
        ...input,
      });
      expect(prisma.statusPage.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          ...input,
        },
      });
    });

    it('throws ConflictException when slug is already taken', async () => {
      const input = {
        name: 'Acme Status',
        slug: 'acme',
      };
      prisma.statusPage.findUnique.mockResolvedValue({
        id: 'existing-1',
        slug: 'acme',
      });

      await expect(service.create('org-1', input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('returns all status pages for an organization', async () => {
      const statusPages = [
        {
          id: 'status-page-1',
          organizationId: 'org-1',
          name: 'Acme Status',
          slug: 'acme',
        },
      ];
      prisma.statusPage.findMany.mockResolvedValue(statusPages);

      const result = await service.findAll('org-1');

      expect(result).toEqual(statusPages);
      expect(prisma.statusPage.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a status page when it belongs to the organization', async () => {
      const statusPage = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Acme Status',
        slug: 'acme',
      };
      prisma.statusPage.findFirst.mockResolvedValue(statusPage);

      const result = await service.findOne('org-1', 'status-page-1');

      expect(result).toEqual(statusPage);
    });

    it('throws NotFoundException when status page does not exist', async () => {
      prisma.statusPage.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('org-1', 'status-page-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when status page belongs to different organization', async () => {
      prisma.statusPage.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('org-1', 'status-page-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a status page', async () => {
      const input = { name: 'Updated Status' };
      const updated = {
        id: 'status-page-1',
        organizationId: 'org-1',
        name: 'Updated Status',
        slug: 'acme',
      };
      prisma.statusPage.findFirst.mockResolvedValue(null);
      prisma.statusPage.updateMany.mockResolvedValue({ count: 1 });
      prisma.statusPage.findFirst.mockResolvedValue(updated);

      const result = await service.update('org-1', 'status-page-1', input);

      expect(result).toEqual(updated);
    });

    it('throws ConflictException when updating to existing slug', async () => {
      const input = { slug: 'existing-slug' };
      prisma.statusPage.findFirst.mockResolvedValue({
        id: 'existing-1',
        slug: 'existing-slug',
      });

      await expect(
        service.update('org-1', 'status-page-1', input),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException when status page does not exist', async () => {
      const input = { name: 'Updated Status' };
      prisma.statusPage.findFirst.mockResolvedValue(null);
      prisma.statusPage.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update('org-1', 'status-page-1', input),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes a status page', async () => {
      prisma.statusPage.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.delete('org-1', 'status-page-1'),
      ).resolves.toBeUndefined();
      expect(prisma.statusPage.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'status-page-1',
          organizationId: 'org-1',
        },
      });
    });

    it('throws NotFoundException when status page does not exist', async () => {
      prisma.statusPage.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.delete('org-1', 'status-page-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
