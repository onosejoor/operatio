import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../../../shared/events/event-handler.interface';

@Injectable()
export class EventDispatcher {
  private readonly logger = new Logger(EventDispatcher.name);
  private readonly handlers = new Map<string, EventHandler>();

  register(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }

  async dispatch(eventType: string, payload: unknown): Promise<void> {
    const handler = this.handlers.get(eventType);

    if (!handler) {
      throw new Error(`No handler registered for event type: ${eventType}`);
    }

    this.logger.log(`Dispatching event: ${eventType}`);
    await handler.handle(payload);
    this.logger.log(`Event dispatched successfully: ${eventType}`);
  }

  hasHandler(eventType: string): boolean {
    return this.handlers.has(eventType);
  }
}
