import { SetMetadata } from '@nestjs/common';

export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER_METADATA';

/**
 * Decorator to mark a method as an event handler.
 * Stores the event type as metadata that can be discovered by EventHandlerRegistrar.
 * 
 * @param eventType - The event type this method handles
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class MonitorConsumer {
 *   @EventHandler(EventType.MONITOR_CREATED)
 *   async handleMonitorCreated(event: MonitorCreatedEvent) {
 *     // Handle monitor created event
 *   }
 * }
 * ```
 */
export const EventHandler = (eventType: string): MethodDecorator => {
  return SetMetadata(EVENT_HANDLER_METADATA, eventType);
};
