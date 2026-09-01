import { AggregateType } from '@prisma/client';

export interface WriteOutboxEvent {
  aggregateType: AggregateType;
  aggregateId: string;
  eventType: string;
  payload: unknown;
}
