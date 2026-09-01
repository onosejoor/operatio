import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository } from '../repositories/outbox.repository';
import { EventDispatcher } from './event-dispatcher';
import { OutboxEvent } from '@prisma/client';

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS = [30000, 60000, 300000, 600000]; // 30s, 1m, 5m, 10m

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
      const payload = JSON.parse(event.payload);

      if (!this.eventDispatcher.hasHandler(event.eventType)) {
        throw new Error(
          `No handler registered for event type: ${event.eventType}`,
        );
      }

      await this.eventDispatcher.dispatch(event.eventType, payload);

      await this.outboxRepository.markProcessed(event.id);

      this.logger.log(
        `Event ${event.id} (${event.eventType}) processed successfully`,
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
        const retryDelay =
          RETRY_DELAYS[Math.min(nextAttempt - 1, RETRY_DELAYS.length - 1)];
        await this.outboxRepository.incrementAttemptsAndScheduleRetry(
          event.id,
          retryDelay,
        );
        this.logger.log(
          `Event ${event.id} scheduled for retry in ${retryDelay}ms (attempt ${nextAttempt}/${MAX_ATTEMPTS})`,
        );
      }
    }
  }
}
