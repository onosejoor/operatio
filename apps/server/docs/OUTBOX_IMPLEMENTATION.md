# Transactional Outbox Architecture Implementation

This document describes the Transactional Outbox Pattern implementation for Operatio.

## Overview

A clean, lightweight internal event/outbox system using NestJS + Prisma + MongoDB. The system ensures reliable event delivery with transactional guarantees.

## Architecture

```
Business Operation → Prisma Transaction → OutboxWriter → OutboxEvent (MongoDB)
                                                               ↓
                                                    OutboxDispatcher (30s polling)
                                                               ↓
                                                    EventDispatcher → Handler
```

## Files Created

### Event Types & Interfaces

- `src/shared/events/event-types.ts` - Event type definitions and AggregateType enum
- `src/shared/events/event-handler.interface.ts` - Handler interface

### Outbox Infrastructure

- `src/infrastructure/outbox/types/outbox.types.ts` - WriteOutboxEvent interface
- `src/infrastructure/outbox/writers/outbox.writer.ts` - OutboxWriter with write() and writeTx()
- `src/infrastructure/outbox/repositories/outbox.repository.ts` - Repository for event operations
- `src/infrastructure/outbox/dispatchers/event-dispatcher.ts` - Event handler registry
- `src/infrastructure/outbox/dispatchers/outbox.dispatcher.ts` - Scheduled dispatcher (30s interval)
- `src/infrastructure/outbox/outbox.module.ts` - NestJS module

### Example Implementation

- `src/monitors/handlers/monitor-created.handler.ts` - MonitorCreatedHandler example

### Tests

- `src/infrastructure/outbox/writers/outbox.writer.spec.ts` - Writer tests
- `src/infrastructure/outbox/repositories/outbox.repository.spec.ts` - Repository tests
- `src/infrastructure/outbox/dispatchers/event-dispatcher.spec.ts` - Dispatcher tests
- `src/infrastructure/outbox/dispatchers/outbox.dispatcher.spec.ts` - Dispatcher integration tests
- `src/monitors/handlers/monitor-created.handler.spec.ts` - Handler tests

## Prisma Schema Changes

Added to `prisma/schema.prisma`:

```prisma
enum AggregateType {
  Monitor
  Incident
  User
  Organization
}

enum OutboxStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

model OutboxEvent {
  id           String       @id @default(auto()) @map("_id") @db.ObjectId
  aggregateType AggregateType
  aggregateId  String
  eventType    String
  payload      String
  status       OutboxStatus @default(PENDING)
  attempts     Int          @default(0)
  availableAt  DateTime     @default(now())
  createdAt    DateTime     @default(now())
  processedAt  DateTime?

  @@index([status, availableAt])
  @@map("outbox_events")
}
```

## Module Changes

### App Module

- Added `OutboxModule` to imports

### Monitors Module

- Added `OutboxModule` to imports
- Added `MonitorCreatedHandler` and event registration provider
- Updated `MonitorsService` to use `OutboxWriter` in transactions

## Usage Example

### Writing Events Transactionally

```typescript
await this.prisma.$transaction(async (tx) => {
  const monitor = await tx.monitor.create({
    data: {
      organizationId,
      ...createMonitorDto,
    },
  });

  await this.outboxWriter.writeTx(tx, {
    aggregateType: AggregateType.Monitor,
    aggregateId: monitor.id,
    eventType: EventType.MONITOR_CREATED,
    payload: {
      monitorId: monitor.id,
      organizationId,
    },
  });
});
```

### Creating a Handler

```typescript
@Injectable()
export class MyEventHandler implements EventHandler<MyPayload> {
  async handle(payload: MyPayload): Promise<void> {
    // Handle event - design for idempotency
  }
}
```

### Registering a Handler

```typescript
{
  provide: 'MY_EVENT_REGISTRATION',
  useFactory: (eventDispatcher: EventDispatcher, handler: MyEventHandler) => {
    eventDispatcher.register(EventType.MY_EVENT, handler);
  },
  inject: [EventDispatcher, MyEventHandler],
}
```

## Key Features

### Transactional Guarantees

- Business mutations and events written in same Prisma transaction
- Atomic: both succeed or both roll back

### Retry Behavior

- Max attempts: 5
- Retry delays: 30s, 1m, 5m, 10m
- Events marked FAILED after max attempts

### Concurrency Protection

- Status transitions: PENDING → PROCESSING → PROCESSED/FAILED
- Claim mechanism prevents duplicate processing
- Stuck event recovery (5-minute threshold)

### Idempotency

- Handlers designed for at-least-once delivery
- Repeated processing should not cause duplicate side effects

### Logging

Structured logs for:

- Event creation
- Event claiming
- Event dispatching
- Event processing
- Event failures
- Retry scheduling
- Permanent failures
- Missing handlers

## Required Package Installations

```bash
cd apps/server
pnpm add @nestjs/schedule
```

## Next Steps

After installing the package:

1. Run Prisma migration:

```bash
pnpm prisma migrate dev --name add_outbox_events
```

2. Regenerate Prisma client:

```bash
pnpm prisma generate
```

3. Start the application:

```bash
pnpm run start:dev
```

The dispatcher will automatically start polling every 30 seconds.

## Extending the System

To add new events:

1. Add event type to `EventType` in `src/shared/events/event-types.ts`
2. Create handler implementing `EventHandler<TPayload>`
3. Register handler in module using factory provider
4. Use `OutboxWriter.writeTx()` in business transactions

## Testing

Run tests with:

```bash
pnpm test
```

All outbox components have comprehensive unit tests covering:

- write() and writeTx() methods
- Payload serialization/deserialization
- Successful dispatch
- Failed dispatch and retry
- Missing handler handling
- Processed event handling
- Concurrent processing scenarios
