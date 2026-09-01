import { Test, TestingModule } from '@nestjs/testing';
import { OutboxDispatcher } from './outbox.dispatcher';
import { OutboxRepository } from '../repositories/outbox.repository';
import { EventDispatcher } from './event-dispatcher';
import { OutboxStatus } from '@prisma/client';

describe('OutboxDispatcher', () => {
  let dispatcher: OutboxDispatcher;
  let outboxRepository: OutboxRepository;
  let eventDispatcher: EventDispatcher;

  const mockOutboxRepository = {
    resetStuckProcessingEvents: jest.fn().mockResolvedValue(undefined),
    findPendingEvents: jest.fn().mockResolvedValue([]),
    claimForProcessing: jest.fn().mockResolvedValue(true),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    incrementAttemptsAndScheduleRetry: jest.fn().mockResolvedValue(undefined),
  };

  const mockEventDispatcher = {
    hasHandler: jest.fn().mockReturnValue(true),
    dispatch: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxDispatcher,
        {
          provide: OutboxRepository,
          useValue: mockOutboxRepository,
        },
        {
          provide: EventDispatcher,
          useValue: mockEventDispatcher,
        },
      ],
    }).compile();

    dispatcher = module.get<OutboxDispatcher>(OutboxDispatcher);
    outboxRepository = module.get<OutboxRepository>(OutboxRepository);
    eventDispatcher = module.get<EventDispatcher>(EventDispatcher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPendingEvents', () => {
    it('should reset stuck events before processing', async () => {
      mockOutboxRepository.findPendingEvents.mockResolvedValue([]);

      await dispatcher.processPendingEvents();

      expect(outboxRepository.resetStuckProcessingEvents).toHaveBeenCalled();
    });

    it('should skip processing when no pending events', async () => {
      mockOutboxRepository.findPendingEvents.mockResolvedValue([]);

      await dispatcher.processPendingEvents();

      expect(outboxRepository.findPendingEvents).toHaveBeenCalled();
      expect(outboxRepository.claimForProcessing).not.toHaveBeenCalled();
    });

    it('should process pending events successfully', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'monitor.created',
        payload: JSON.stringify({ monitorId: 'monitor-123' }),
        attempts: 0,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockEventDispatcher.dispatch.mockResolvedValue(undefined);

      await dispatcher.processPendingEvents();

      expect(outboxRepository.claimForProcessing).toHaveBeenCalledWith('event-1');
      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
        'monitor.created',
        { monitorId: 'monitor-123' },
      );
      expect(outboxRepository.markProcessed).toHaveBeenCalledWith('event-1');
    });

    it('should handle event that cannot be claimed', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'monitor.created',
        payload: JSON.stringify({ monitorId: 'monitor-123' }),
        attempts: 0,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockOutboxRepository.claimForProcessing.mockResolvedValue(false);

      await dispatcher.processPendingEvents();

      expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
      expect(outboxRepository.markProcessed).not.toHaveBeenCalled();
    });
  });

  describe('event processing with failures', () => {
    it('should retry failed event', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'monitor.created',
        payload: JSON.stringify({ monitorId: 'monitor-123' }),
        attempts: 0,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockEventDispatcher.dispatch.mockRejectedValue(new Error('Handler failed'));

      await dispatcher.processPendingEvents();

      expect(outboxRepository.markProcessed).not.toHaveBeenCalled();
      expect(outboxRepository.incrementAttemptsAndScheduleRetry).toHaveBeenCalledWith(
        'event-1',
        30000,
      );
    });

    it('should mark event as failed after max attempts', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'monitor.created',
        payload: JSON.stringify({ monitorId: 'monitor-123' }),
        attempts: 4,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockEventDispatcher.dispatch.mockRejectedValue(new Error('Handler failed'));

      await dispatcher.processPendingEvents();

      expect(outboxRepository.markFailed).toHaveBeenCalledWith('event-1');
      expect(outboxRepository.incrementAttemptsAndScheduleRetry).not.toHaveBeenCalled();
    });

    it('should handle missing handler', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'unknown.event',
        payload: JSON.stringify({ data: 'test' }),
        attempts: 0,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockEventDispatcher.hasHandler.mockReturnValue(false);

      await dispatcher.processPendingEvents();

      expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
      expect(outboxRepository.incrementAttemptsAndScheduleRetry).toHaveBeenCalledWith(
        'event-1',
        30000,
      );
    });
  });

  describe('payload deserialization', () => {
    it('should deserialize JSON payload correctly', async () => {
      const complexPayload = {
        monitorId: 'monitor-123',
        organizationId: 'org-123',
        metadata: { key: 'value', nested: { field: 123 } },
      };

      const mockEvent = {
        id: 'event-1',
        eventType: 'monitor.created',
        payload: JSON.stringify(complexPayload),
        attempts: 0,
      };

      mockOutboxRepository.findPendingEvents.mockResolvedValue([mockEvent]);
      mockEventDispatcher.dispatch.mockResolvedValue(undefined);

      await dispatcher.processPendingEvents();

      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
        'monitor.created',
        complexPayload,
      );
    });
  });
});
