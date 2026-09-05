import { AggregateType } from '@prisma/client';

const buildEventType = (aggregate: AggregateType, event: string): string =>
  `${aggregate}.${event}`.toLowerCase();

export const EventType = {
  MONITOR_CREATED: buildEventType(AggregateType.Monitor, 'Created'),
  MONITOR_UPDATED: buildEventType(AggregateType.Monitor, 'Updated'),
  MONITOR_DELETED: buildEventType(AggregateType.Monitor, 'Deleted'),
  MONITOR_CHECK_REQUESTED: buildEventType(
    AggregateType.Monitor,
    'CheckRequested',
  ),
  MONITOR_STATUS_CHANGED: buildEventType(AggregateType.Monitor, 'StatusChanged'),
  INCIDENT_CREATED: buildEventType(AggregateType.Incident, 'Created'),
  INCIDENT_RESOLVED: buildEventType(AggregateType.Incident, 'Resolved'),
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];
