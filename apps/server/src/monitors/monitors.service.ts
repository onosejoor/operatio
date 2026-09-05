import { Injectable, NotFoundException } from '@nestjs/common';
import { MonitorStatus, AggregateType, Prisma } from '@prisma/client';
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
  nextCheckAt: true,
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
    await this.prisma.$transaction(
      async (tx) => {
        const interval = createMonitorDto.interval || 60;
        const now = new Date();
        const nextCheckAt = new Date(now.getTime() + interval * 1000);

        const monitor = await tx.monitor.create({
          data: {
            organizationId,
            ...createMonitorDto,
            nextCheckAt,
          },
          select: { id: true },
        });

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
      updateMonitorDto.isActive === true || updateMonitorDto.url !== undefined;

    await this.prisma.$transaction(
      async (tx) => {
        const updateData: Prisma.MonitorUpdateInput = { ...updateMonitorDto };

        if (updateMonitorDto.interval !== undefined) {
          const monitor = await tx.monitor.findFirst({
            where: { id: monitorId, organizationId },
            select: { interval: true },
          });

          if (monitor) {
            updateData.nextCheckAt = new Date(
              Date.now() + updateMonitorDto.interval * 1000,
            );
          }
        }

        if (
          updateMonitorDto.url !== undefined ||
          updateMonitorDto.isActive === true
        ) {
          updateData.status = MonitorStatus.PENDING;
        }

        const result = await tx.monitor.updateMany({
          where: { id: monitorId, organizationId },
          data: updateData,
        });

        if (result.count === 0) {
          throw new NotFoundException('Monitor not found');
        }

        if (shouldCheck) {
          await this.outboxWriter.writeTx(tx, {
            aggregateType: AggregateType.Monitor,
            idempotencyKey: `monitor-check-requested-${monitorId}-${Date.now()}`,
            aggregateId: monitorId,
            eventType: EventType.MONITOR_CHECK_REQUESTED,
            payload: {
              monitorId,
            },
          });
        }
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );
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

  async getChecks(
    organizationId: string,
    monitorId: string,
    page: number = 1,
    limit: number = 50,
    fromDate?: string,
    toDate?: string,
  ) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate);
    }

    const whereClause: Prisma.MonitorCheckWhereInput = { monitorId };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.checkedAt = dateFilter;
    }

    const [checks, total] = await Promise.all([
      this.prisma.monitorCheck.findMany({
        where: whereClause,
        orderBy: { checkedAt: 'desc' },
        select: {
          id: true,
          status: true,
          statusCode: true,
          responseTimeMs: true,
          checkedAt: true,
          error: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.monitorCheck.count({
        where: whereClause,
      }),
    ]);

    return {
      checks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(organizationId: string, monitorId: string) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    const checks = await this.prisma.monitorCheck.findMany({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      take: 1000,
    });

    if (checks.length === 0) {
      return {
        checkSuccessRate: 0,
        averageResponseTime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        latestStatus: monitor.status,
      };
    }

    const successfulChecks = checks.filter(
      (check) => check.status === MonitorStatus.UP,
    ).length;
    const failedChecks = checks.filter(
      (check) => check.status === MonitorStatus.DOWN,
    ).length;
    const checkSuccessRate = (successfulChecks / checks.length) * 100;
    const averageResponseTime =
      checks.reduce((sum, check) => sum + check.responseTimeMs, 0) /
      checks.length;

    return {
      checkSuccessRate: Math.round(checkSuccessRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      totalChecks: checks.length,
      successfulChecks,
      failedChecks,
      latestStatus: monitor.status,
    };
  }
}
