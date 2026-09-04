import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository } from '../repositories/outbox.repository';
import { EventDispatcher } from './event-dispatcher';
import { OutboxEvent } from '@prisma/client';
import { EventMessage } from '../types/outbox.types';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000; // flat 5s between attempts

@Injectable()
export class OutboxDispatcher {
  private readonly logger = new Logger(OutboxDispatcher.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) { }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingEvents(): Promise<void> {
    try {
      await this.outboxRepository.resetStuckProcessingEvents();

      const pendingEvents = await this.outboxRepository.findPendingEvents(50);

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(
        `Processing ${pendingEvents.length} pending outbox events`,
      );

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error('Error processing pending events', error);
    }
  }

  private async processEvent(event: OutboxEvent): Promise<void> {
    const claimed = await this.outboxRepository.claimForProcessing(event.id);

    if (!claimed) {
      this.logger.debug(`Event ${event.id} already claimed by another worker`);
      return;
    }

    this.logger.log(
      `Processing event ${event.id}: ${event.eventType} (attempt ${event.attempts + 1})`,
    );

    try {
      if (!this.eventDispatcher.hasHandler(event.eventType)) {
        throw new Error(
          `No handler registered for event type: ${event.eventType}`,
        );
      }

      const message: EventMessage = {
        idempotencyKey: event.idempotencyKey,
        payload: event.payload,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
      };

      await this.eventDispatcher.dispatch(event.eventType, message);

      // No markProcessed() here — the handler already did it via idempotencyKey.
      this.logger.log(
        `Event ${event.id} (${event.eventType}) dispatched successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process event ${event.id} (${event.eventType})`,
        error,
      );

      const nextAttempt = event.attempts + 1;

      if (nextAttempt >= MAX_ATTEMPTS) {
        await this.outboxRepository.markFailed(event.id);
        this.logger.error(
          `Event ${event.id} permanently failed after ${MAX_ATTEMPTS} attempts`,
        );
      } else {
        await this.outboxRepository.incrementAttemptsAndScheduleRetry(
          event.id,
          RETRY_DELAY_MS,
        );
        this.logger.log(
          `Event ${event.id} scheduled for retry in ${RETRY_DELAY_MS}ms (attempt ${nextAttempt}/${MAX_ATTEMPTS})`,
        );
      }
    }
  }
}
