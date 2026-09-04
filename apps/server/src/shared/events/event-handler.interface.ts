import { EventMessage } from '@/infrastructure/outbox/types/outbox.types';

export interface EventHandler {
  handle(message: EventMessage): Promise<void>;
}
