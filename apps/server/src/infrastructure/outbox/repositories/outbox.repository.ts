import { Injectable, Logger } from '@nestjs/common';
import { Prisma, OutboxStatus } from '@prisma/client';
import { PrismaService } from '../../../database/database.service';

@Injectable()
export class OutboxRepository {
  private readonly logger = new Logger(OutboxRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findPendingEvents(limit: number = 100) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PENDING,
        availableAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async claimForProcessing(id: string): Promise<boolean> {
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id,
        status: OutboxStatus.PENDING,
      },
      data: {
        status: OutboxStatus.PROCESSING,
      },
    });

    const claimed = result.count > 0;
    if (claimed) {
      this.logger.log(`Event ${id} claimed for processing`);
    }
    return claimed;
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
    this.logger.log(`Event ${id} marked as processed`);
  }

  async markFailed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        processedAt: new Date(),
      },
    });
    this.logger.log(`Event ${id} marked as failed`);
  }

  async incrementAttemptsAndScheduleRetry(
    id: string,
    retryDelay: number,
  ): Promise<void> {
    const availableAt = new Date(Date.now() + retryDelay);
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        status: OutboxStatus.PENDING,
        availableAt,
      },
    });
    this.logger.log(
      `Event ${id} attempts incremented, retry scheduled at ${availableAt.toISOString()}`,
    );
  }

  async resetStuckProcessingEvents(stuckThreshold: number = 300000): Promise<void> {
    const threshold = new Date(Date.now() - stuckThreshold);
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        status: OutboxStatus.PROCESSING,
        createdAt: { lt: threshold },
      },
      data: {
        status: OutboxStatus.PENDING,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Reset ${result.count} stuck processing events to PENDING`,
      );
    }
  }
}
