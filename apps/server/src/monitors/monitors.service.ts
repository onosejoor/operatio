import { Injectable, NotFoundException } from '@nestjs/common';
import { MonitorStatus, AggregateType } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { OutboxWriter } from '../infrastructure/outbox/writers/outbox.writer';
import { EventType } from '../shared/events/event-types';
import { PRISMA_TRANSACTION_TIMEOUT } from '@/constants';

const monitorSelect = {
  id: true,
  name: true,
  url: true,
  interval: true,
  timeout: true,
  status: true,
  isActive: true,
  lastCheckedAt: true,
  lastStatusCode: true,
  lastResponseTimeMs: true,
} as const;

@Injectable()
export class MonitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxWriter: OutboxWriter,
  ) {}

  async create(
    organizationId: string,
    createMonitorDto: CreateMonitorDto,
  ): Promise<void> {
    const monitorId = await this.prisma.$transaction(
      async (tx) => {
        const monitor = await tx.monitor.create({
          data: {
            organizationId,
            ...createMonitorDto,
          },
          select: { id: true },
        });

        // await this.outboxWriter.writeTx(tx, {
        //   aggregateType: AggregateType.Monitor,
        //   idempotencyKey: `monitor-created-${monitor.id}`,
        //   aggregateId: monitor.id,
        //   eventType: EventType.MONITOR_CREATED,
        //   payload: {
        //     monitorId: monitor.id,
        //     organizationId,
        //   },
        // });

        await this.outboxWriter.writeTx(tx, {
          aggregateType: AggregateType.Monitor,
          idempotencyKey: `monitor-check-requested-${monitor.id}`,
          aggregateId: monitor.id,
          eventType: EventType.MONITOR_CHECK_REQUESTED,
          payload: {
            monitorId: monitor.id,
          },
        });

        return monitor.id;
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );
  }

  async findAll(organizationId: string) {
    return this.prisma.monitor.findMany({
      where: { organizationId },
      select: monitorSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(organizationId: string, monitorId: string) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
      select: monitorSelect,
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    return monitor;
  }

  async update(
    organizationId: string,
    monitorId: string,
    updateMonitorDto: UpdateMonitorDto,
  ): Promise<void> {
    const shouldCheck =
      updateMonitorDto.url !== undefined || updateMonitorDto.isActive === true;
    const result = await this.prisma.monitor.updateMany({
      where: { id: monitorId, organizationId },
      data: {
        ...updateMonitorDto,
        ...(shouldCheck ? { status: MonitorStatus.PENDING } : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found');
    }

    if (shouldCheck) {
      await this.outboxWriter.write({
        aggregateType: AggregateType.Monitor,
        idempotencyKey: `monitor-check-requested-${monitorId}-${Date.now()}`,
        aggregateId: monitorId,
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        payload: {
          monitorId,
        },
      });
    }
  }

  async disable(organizationId: string, monitorId: string): Promise<void> {
    const result = await this.prisma.monitor.updateMany({
      where: { id: monitorId, organizationId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }
}
