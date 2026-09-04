import { AggregateType } from '@prisma/client';

export interface WriteOutboxEvent {
  aggregateType: AggregateType;
  idempotencyKey: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
}

export interface EventMessage {
  idempotencyKey: string;
  payload: string;
  aggregateType: AggregateType;
  aggregateId: string;
  eventType: string;
}
