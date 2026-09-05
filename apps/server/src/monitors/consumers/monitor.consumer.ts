import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from 'src/shared/events/event-handler.decorator';
import { EventType } from 'src/shared/events/event-types';
import { type EventMessage } from '@/infrastructure/outbox/types/outbox.types';
import { OutboxRepository } from '@/infrastructure/outbox/repositories/outbox.repository';
import { MonitorCheckService } from '../checker/monitor-check.service';

interface MonitorCreatedPayload {
  monitorId: string;
  organizationId: string;
}

interface MonitorUpdatedPayload {
  monitorId: string;
  organizationId: string;
  changes: Record<string, unknown>;
}

interface MonitorDeletedPayload {
  monitorId: string;
  organizationId: string;
}

interface MonitorCheckRequestedPayload {
  monitorId: string;
}

@Injectable()
export class MonitorConsumer {
  private readonly logger = new Logger(MonitorConsumer.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly monitorCheckService: MonitorCheckService,
  ) {}

  @EventHandler(EventType.MONITOR_CREATED)
  async handleMonitorCreated(message: EventMessage): Promise<void> {
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Monitor created event already processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: MonitorCreatedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor created event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Add any side effects here (e.g., send notification, update analytics, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  @EventHandler(EventType.MONITOR_UPDATED)
  async handleMonitorUpdated(message: EventMessage): Promise<void> {
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Monitor updated event already processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: MonitorUpdatedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor updated event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Handle monitor updates (e.g., sync with external systems, update caches, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  @EventHandler(EventType.MONITOR_DELETED)
  async handleMonitorDeleted(message: EventMessage): Promise<void> {
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) return;

    const payload: MonitorDeletedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor deleted event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  @EventHandler(EventType.MONITOR_CHECK_REQUESTED)
  async handleMonitorCheckRequested(message: EventMessage): Promise<void> {
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Monitor check requested event already processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: MonitorCheckRequestedPayload = JSON.parse(message.payload);
    this.logger.log(`Monitor check requested for: ${payload.monitorId}`);

    await this.monitorCheckService.execute(payload.monitorId);

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }
}
