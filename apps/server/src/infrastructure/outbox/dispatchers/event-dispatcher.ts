import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '@/shared/events/event-handler.interface';

@Injectable()
export class EventDispatcher {
  private readonly logger = new Logger(EventDispatcher.name);
  private readonly handlers = new Map<string, EventHandler[]>();

  register(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    this.logger.log(
      `Registered handler for event type: ${eventType} (total handlers: ${this.handlers.get(eventType)!.length})`,
    );
  }

  async dispatch(eventType: string, payload: unknown): Promise<void> {
    const handlers = this.handlers.get(eventType);

    if (!handlers || handlers.length === 0) {
      throw new Error(`No handler registered for event type: ${eventType}`);
    }

    this.logger.log(
      `Dispatching event: ${eventType} to ${handlers.length} handler(s)`,
    );

    for (const handler of handlers) {
      await handler.handle(payload);
    }

    this.logger.log(`Event dispatched successfully: ${eventType}`);
  }

  hasHandler(eventType: string): boolean {
    const handlers = this.handlers.get(eventType);
    return handlers !== undefined && handlers.length > 0;
  }
}
