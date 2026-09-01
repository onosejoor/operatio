import { Test, TestingModule } from '@nestjs/testing';
import { OutboxWriter } from './outbox.writer';
import { PrismaService } from '../../../database/database.service';
import { AggregateType } from '@prisma/client';
import { WriteOutboxEvent } from '../types/outbox.types';

describe('OutboxWriter', () => {
  let writer: OutboxWriter;
  let prismaService: PrismaService;

  const mockPrismaService = {
    outboxEvent: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxWriter,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    writer = module.get<OutboxWriter>(OutboxWriter);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('write', () => {
    it('should create an outbox event with serialized payload', async () => {
      const event: WriteOutboxEvent = {
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-123',
        eventType: 'monitor.created',
        payload: { monitorId: 'monitor-123', organizationId: 'org-123' },
      };

      mockPrismaService.outboxEvent.create.mockResolvedValue({ id: 'event-1' });

      await writer.write(event);

      expect(prismaService.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          aggregateType: AggregateType.Monitor,
          aggregateId: 'monitor-123',
          eventType: 'monitor.created',
          payload: JSON.stringify(event.payload),
        },
      });
    });

    it('should serialize complex payload objects', async () => {
      const event: WriteOutboxEvent = {
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-123',
        eventType: 'monitor.created',
        payload: {
          monitorId: 'monitor-123',
          organizationId: 'org-123',
          metadata: { key: 'value', nested: { field: 123 } },
        },
      };

      mockPrismaService.outboxEvent.create.mockResolvedValue({ id: 'event-1' });

      await writer.write(event);

      expect(prismaService.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: JSON.stringify(event.payload),
        }),
      });
    });
  });

  describe('writeTx', () => {
    it('should create an outbox event using transaction client', async () => {
      const event: WriteOutboxEvent = {
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-123',
        eventType: 'monitor.created',
        payload: { monitorId: 'monitor-123', organizationId: 'org-123' },
      };

      const mockTx = {
        outboxEvent: {
          create: jest.fn().mockResolvedValue({ id: 'event-1' }),
        },
      };

      await writer.writeTx(mockTx as any, event);

      expect(mockTx.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          aggregateType: AggregateType.Monitor,
          aggregateId: 'monitor-123',
          eventType: 'monitor.created',
          payload: JSON.stringify(event.payload),
        },
      });

      // Ensure root prisma client was NOT used
      expect(prismaService.outboxEvent.create).not.toHaveBeenCalled();
    });

    it('should serialize payload in transaction', async () => {
      const event: WriteOutboxEvent = {
        aggregateType: AggregateType.Incident,
        aggregateId: 'incident-123',
        eventType: 'incident.created',
        payload: { incidentId: 'incident-123', severity: 'high' },
      };

      const mockTx = {
        outboxEvent: {
          create: jest.fn().mockResolvedValue({ id: 'event-1' }),
        },
      };

      await writer.writeTx(mockTx as any, event);

      expect(mockTx.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: JSON.stringify(event.payload),
        }),
      });
    });
  });
});
