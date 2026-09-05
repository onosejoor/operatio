import { MonitorConsumer } from '../consumers/monitor.consumer';
import { OutboxRepository } from '../../infrastructure/outbox/repositories/outbox.repository';
import { MonitorCheckService } from '../checker/monitor-check.service';
import { EventType } from '../../shared/events/event-types';
import type { EventMessage } from '../../infrastructure/outbox/types/outbox.types';

describe('MonitorConsumer', () => {
  const outboxRepository = {
    tryClaimProcessing: jest.fn(),
    markProcessedByKey: jest.fn(),
  };
  const monitorCheckService = {
    execute: jest.fn(),
  };
  const consumer = new MonitorConsumer(
    outboxRepository as never,
    monitorCheckService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMonitorCreated', () => {
    it('processes monitor created event', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-created-1',
        eventType: EventType.MONITOR_CREATED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(true);

      await consumer.handleMonitorCreated(message);

      expect(outboxRepository.tryClaimProcessing).toHaveBeenCalledWith('monitor-created-1');
      expect(outboxRepository.markProcessedByKey).toHaveBeenCalledWith('monitor-created-1');
    });

    it('skips already processed events', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-created-1',
        eventType: EventType.MONITOR_CREATED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(false);

      await consumer.handleMonitorCreated(message);

      expect(outboxRepository.markProcessedByKey).not.toHaveBeenCalled();
    });
  });

  describe('handleMonitorUpdated', () => {
    it('processes monitor updated event', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-updated-1',
        eventType: EventType.MONITOR_UPDATED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
          changes: { name: 'New Name' },
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(true);

      await consumer.handleMonitorUpdated(message);

      expect(outboxRepository.tryClaimProcessing).toHaveBeenCalledWith('monitor-updated-1');
      expect(outboxRepository.markProcessedByKey).toHaveBeenCalledWith('monitor-updated-1');
    });

    it('skips already processed events', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-updated-1',
        eventType: EventType.MONITOR_UPDATED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
          changes: { name: 'New Name' },
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(false);

      await consumer.handleMonitorUpdated(message);

      expect(outboxRepository.markProcessedByKey).not.toHaveBeenCalled();
    });
  });

  describe('handleMonitorDeleted', () => {
    it('processes monitor deleted event', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-deleted-1',
        eventType: EventType.MONITOR_DELETED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(true);

      await consumer.handleMonitorDeleted(message);

      expect(outboxRepository.tryClaimProcessing).toHaveBeenCalledWith('monitor-deleted-1');
      expect(outboxRepository.markProcessedByKey).toHaveBeenCalledWith('monitor-deleted-1');
    });

    it('skips already processed events', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-deleted-1',
        eventType: EventType.MONITOR_DELETED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
          organizationId: 'org-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(false);

      await consumer.handleMonitorDeleted(message);

      expect(outboxRepository.markProcessedByKey).not.toHaveBeenCalled();
    });
  });

  describe('handleMonitorCheckRequested', () => {
    it('processes monitor check requested event and executes check', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-check-requested-1',
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(true);
      monitorCheckService.execute.mockResolvedValue(undefined);

      await consumer.handleMonitorCheckRequested(message);

      expect(outboxRepository.tryClaimProcessing).toHaveBeenCalledWith('monitor-check-requested-1');
      expect(monitorCheckService.execute).toHaveBeenCalledWith('monitor-1');
      expect(outboxRepository.markProcessedByKey).toHaveBeenCalledWith('monitor-check-requested-1');
    });

    it('skips already processed events', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-check-requested-1',
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(false);

      await consumer.handleMonitorCheckRequested(message);

      expect(monitorCheckService.execute).not.toHaveBeenCalled();
      expect(outboxRepository.markProcessedByKey).not.toHaveBeenCalled();
    });

    it('handles execution errors gracefully', async () => {
      const message: EventMessage = {
        idempotencyKey: 'monitor-check-requested-1',
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: 'Monitor',
        aggregateId: 'monitor-1',
        payload: JSON.stringify({
          monitorId: 'monitor-1',
        }),
      };

      outboxRepository.tryClaimProcessing.mockResolvedValue(true);
      monitorCheckService.execute.mockRejectedValue(new Error('Check failed'));

      await expect(consumer.handleMonitorCheckRequested(message)).rejects.toThrow('Check failed');

      expect(monitorCheckService.execute).toHaveBeenCalledWith('monitor-1');
    });
  });
});
