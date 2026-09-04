import { Injectable, Logger } from '@nestjs/common';
import { OutboxStatus, Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../database/database.service';
import { WriteOutboxEvent } from '../types/outbox.types';

@Injectable()
export class OutboxWriter {
  private readonly logger = new Logger(OutboxWriter.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(event: WriteOutboxEvent): Promise<void> {
    await this.prisma.outboxEvent.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        status: OutboxStatus.PENDING,
        idempotencyKey: event.idempotencyKey,
        payload: JSON.stringify(event.payload),
      },
    });

    this.logger.log(
      `Outbox event created: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`,
    );
  }

  async writeTx(
    tx: Prisma.TransactionClient,
    event: WriteOutboxEvent,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        idempotencyKey: event.idempotencyKey,
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
        status: OutboxStatus.PENDING,
      },
    });

    this.logger.log(
      `Outbox event created in transaction: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`,
    );
  }
}
