import { AggregateType } from '@prisma/client';

const buildEventType = (
  aggregate: AggregateType,
  event: string,
): string => `${aggregate}.${event}`.toLowerCase();

export const EventType = {
  MONITOR_CREATED: buildEventType(AggregateType.Monitor, 'Created'),
  MONITOR_UPDATED: buildEventType(AggregateType.Monitor, 'Updated'),
  MONITOR_DELETED: buildEventType(AggregateType.Monitor, 'Deleted'),
  INCIDENT_CREATED: buildEventType(AggregateType.Incident, 'Created'),
  INCIDENT_RESOLVED: buildEventType(AggregateType.Incident, 'Resolved'),
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];
