import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../../shared/events/event-handler.interface';

interface MonitorCreatedPayload {
  monitorId: string;
  organizationId: string;
}

@Injectable()
export class MonitorCreatedHandler implements EventHandler<MonitorCreatedPayload> {
  private readonly logger = new Logger(MonitorCreatedHandler.name);

  async handle(payload: MonitorCreatedPayload): Promise<void> {
    this.logger.log(
      `Monitor created event received: ${payload.monitorId} for organization ${payload.organizationId}`,
    );

    // Example: Add any side effects here (e.g., send notification, update analytics, etc.)
    // This handler is designed to be idempotent - repeated processing should not cause issues
  }
}
