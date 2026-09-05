import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { EventType } from '../../shared/events/event-types';
import { AggregateType, Monitor } from '@prisma/client';

@Injectable()
export class MonitorSchedulerService {
  private readonly logger = new Logger(MonitorSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxWriter: OutboxWriter,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async scheduleMonitorChecks(): Promise<void> {
    try {
      const now = new Date();

      const dueMonitors = await this.prisma.monitor.findMany({
        where: {
          isActive: true,
          nextCheckAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          name: true,
          interval: true,
          nextCheckAt: true,
        },
      });

      if (dueMonitors.length === 0) {
        return;
      }

      this.logger.log(`Found ${dueMonitors.length} monitors due for checking`);

      for (const monitor of dueMonitors) {
        try {
          await this.claimAndScheduleCheck(monitor);
        } catch (error) {
          this.logger.error(
            `Failed to schedule check for monitor ${monitor.id}`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in monitor scheduler', error);
    }
  }

  private async claimAndScheduleCheck(monitor: {
    id: string;
    name: string;
    interval: number;
    nextCheckAt: Date | null;
  }): Promise<void> {
    const claimed = await this.prisma.$transaction(async (tx) => {
      const currentMonitor = await tx.monitor.findUnique({
        where: { id: monitor.id },
        select: { nextCheckAt: true, isActive: true },
      });

      if (!currentMonitor || !currentMonitor.isActive) {
        return false;
      }

      if (
        currentMonitor.nextCheckAt?.getTime() !== monitor.nextCheckAt?.getTime()
      ) {
        return false;
      }

      const now = new Date();
      const newNextCheckAt = new Date(now.getTime() + monitor.interval * 1000);

      await tx.monitor.update({
        where: { id: monitor.id },
        data: { nextCheckAt: newNextCheckAt },
      });

      return true;
    });

    if (claimed) {
      await this.outboxWriter.write({
        aggregateType: AggregateType.Monitor,
        idempotencyKey: `monitor-check-requested-${monitor.id}-${Date.now()}`,
        aggregateId: monitor.id,
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        payload: {
          monitorId: monitor.id,
        },
      });
      this.logger.debug(
        `Claimed and scheduled check for monitor ${monitor.id} (${monitor.name})`,
      );
    } else {
      this.logger.debug(
        `Monitor ${monitor.id} was already claimed by another scheduler instance`,
      );
    }
  }
}
