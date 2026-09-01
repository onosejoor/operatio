import { Test, TestingModule } from '@nestjs/testing';
import { OutboxRepository } from './outbox.repository';
import { PrismaService } from '../../../database/database.service';
import { OutboxStatus } from '@prisma/client';

describe('OutboxRepository', () => {
  let repository: OutboxRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    outboxEvent: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<OutboxRepository>(OutboxRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPendingEvents', () => {
    it('should find pending events available for processing', async () => {
      const mockEvents = [
        { id: '1', eventType: 'monitor.created' },
        { id: '2', eventType: 'incident.created' },
      ];

      mockPrismaService.outboxEvent.findMany.mockResolvedValue(mockEvents);

      const result = await repository.findPendingEvents(50);

      expect(prismaService.outboxEvent.findMany).toHaveBeenCalledWith({
        where: {
          status: OutboxStatus.PENDING,
          availableAt: { lte: expect.any(Date) },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should use default limit when not specified', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([]);

      await repository.findPendingEvents();

      expect(prismaService.outboxEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('claimForProcessing', () => {
    it('should claim event successfully when status is PENDING', async () => {
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.claimForProcessing('event-1');

      expect(prismaService.outboxEvent.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'event-1',
          status: OutboxStatus.PENDING,
        },
        data: {
          status: OutboxStatus.PROCESSING,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when event already claimed', async () => {
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.claimForProcessing('event-1');

      expect(result).toBe(false);
    });
  });

  describe('markProcessed', () => {
    it('should mark event as processed with timestamp', async () => {
      mockPrismaService.outboxEvent.update.mockResolvedValue({ id: 'event-1' });

      await repository.markProcessed('event-1');

      expect(prismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: {
          status: OutboxStatus.PROCESSED,
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markFailed', () => {
    it('should mark event as failed with timestamp', async () => {
      mockPrismaService.outboxEvent.update.mockResolvedValue({ id: 'event-1' });

      await repository.markFailed('event-1');

      expect(prismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: {
          status: OutboxStatus.FAILED,
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('incrementAttemptsAndScheduleRetry', () => {
    it('should increment attempts and set availableAt for retry', async () => {
      mockPrismaService.outboxEvent.update.mockResolvedValue({ id: 'event-1' });

      const retryDelay = 30000;

      await repository.incrementAttemptsAndScheduleRetry('event-1', retryDelay);

      expect(prismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: {
          attempts: { increment: 1 },
          status: OutboxStatus.PENDING,
          availableAt: expect.any(Date),
        },
      });
    });
  });

  describe('resetStuckProcessingEvents', () => {
    it('should reset stuck processing events to PENDING', async () => {
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 5 });

      await repository.resetStuckProcessingEvents(300000);

      expect(prismaService.outboxEvent.updateMany).toHaveBeenCalledWith({
        where: {
          status: OutboxStatus.PROCESSING,
          createdAt: { lt: expect.any(Date) },
        },
        data: {
          status: OutboxStatus.PENDING,
        },
      });
    });

    it('should use default stuck threshold', async () => {
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 0 });

      await repository.resetStuckProcessingEvents();

      const threshold = new Date(Date.now() - 300000);
      expect(prismaService.outboxEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { lt: expect.any(Date) },
          }),
        }),
      );
    });
  });
});
