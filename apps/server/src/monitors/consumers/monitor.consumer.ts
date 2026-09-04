import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from 'src/shared/events/event-handler.decorator';
import { EventType } from 'src/shared/events/event-types';
import { type EventMessage } from '@/infrastructure/outbox/types/outbox.types';

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

@Injectable()
export class MonitorConsumer {
  private readonly logger = new Logger(MonitorConsumer.name);

  @EventHandler(EventType.MONITOR_CREATED)
  async handleMonitorCreated(message: EventMessage): Promise<void> {
    const payload: MonitorCreatedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor created event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Add any side effects here (e.g., send notification, update analytics, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues
  }

  @EventHandler(EventType.MONITOR_UPDATED)
  async handleMonitorUpdated(message: EventMessage): Promise<void> {
    const payload: MonitorUpdatedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor updated event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Handle monitor updates (e.g., sync with external systems, update caches, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues
  }

  @EventHandler(EventType.MONITOR_DELETED)
  async handleMonitorDeleted(message: EventMessage): Promise<void> {
    const payload: MonitorDeletedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor deleted event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Handle monitor deletion (e.g., cleanup resources, notify users, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues
  }
}
