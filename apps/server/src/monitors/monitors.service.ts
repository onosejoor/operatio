import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
  isPublic: true,
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
  ): Promise<string> {
    const existingMonitor = await this.prisma.monitor.findFirst({
      where: {
        organizationId,
        url: createMonitorDto.url,
      },
      select: { id: true },
    });

    if (existingMonitor) {
      throw new ConflictException('A monitor with this URL already exists in your organization');
    }

    return await this.prisma.$transaction(
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
      where: { organizationId, isActive: true },
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
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
      select: {
        name: true,
        url: true,
        interval: true,
        timeout: true,
        isActive: true,
        isPublic: true,
      },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    const updateData: Prisma.MonitorUpdateInput = {};
    if (updateMonitorDto.name !== undefined && updateMonitorDto.name !== monitor.name) {
      updateData.name = updateMonitorDto.name;
    }
    if (updateMonitorDto.url !== undefined && updateMonitorDto.url !== monitor.url) {
      updateData.url = updateMonitorDto.url;
    }
    if (
      updateMonitorDto.interval !== undefined &&
      updateMonitorDto.interval !== monitor.interval
    ) {
      updateData.interval = updateMonitorDto.interval;
    }
    if (
      updateMonitorDto.timeout !== undefined &&
      updateMonitorDto.timeout !== monitor.timeout
    ) {
      updateData.timeout = updateMonitorDto.timeout;
    }
    if (
      updateMonitorDto.isPublic !== undefined &&
      updateMonitorDto.isPublic !== monitor.isPublic
    ) {
      updateData.isPublic = updateMonitorDto.isPublic;
    }
    if (
      updateMonitorDto.isActive !== undefined &&
      updateMonitorDto.isActive !== monitor.isActive
    ) {
      updateData.isActive = updateMonitorDto.isActive;
    }

    const urlChanged = updateData.url !== undefined;
    const wasReactivated = updateData.isActive === true && !monitor.isActive;
    const intervalChanged = updateData.interval !== undefined;
    const shouldCheck = urlChanged || wasReactivated;

    if (urlChanged) {
      const existingMonitor = await this.prisma.monitor.findFirst({
        where: {
          organizationId,
          url: updateMonitorDto.url,
          id: { not: monitorId },
        },
        select: { id: true },
      });

      if (existingMonitor) {
        throw new ConflictException(
          'A monitor with this URL already exists in your organization',
        );
      }
    }

    if (shouldCheck || intervalChanged) {
      updateData.nextCheckAt = new Date(
        Date.now() + (updateMonitorDto.interval ?? monitor.interval) * 1000,
      );
    }

    if (shouldCheck) {
      updateData.status = MonitorStatus.PENDING;
    }

    if (Object.keys(updateData).length === 0) return;

    await this.prisma.$transaction(
      async (tx) => {
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
    status?: MonitorStatus,
    sort: 'newest' | 'oldest' | 'slowest' = 'newest',
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

    const whereClause: Prisma.MonitorCheckWhereInput = {
      monitorId,
      organizationId,
      ...(status ? { status } : {}),
    };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.checkedAt = dateFilter;
    }

    const [checks, total] = await Promise.all([
      this.prisma.monitorCheck.findMany({
        where: whereClause,
        orderBy:
          sort === 'slowest'
            ? { responseTimeMs: 'desc' }
            : { checkedAt: sort === 'oldest' ? 'asc' : 'desc' },
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

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [result, recentChecks] = await Promise.all([
      this.prisma.$runCommandRaw({
      aggregate: 'monitor_checks',
      pipeline: [
        {
          $match: {
            monitorId: { $oid: monitorId },
            organizationId: { $oid: organizationId },
          },
        },
        {
          $group: {
            _id: null,
            totalChecks: { $sum: 1 },
            successfulChecks: {
              $sum: {
                $cond: [{ $eq: ['$status', MonitorStatus.UP] }, 1, 0],
              },
            },
            failedChecks: {
              $sum: {
                $cond: [{ $eq: ['$status', MonitorStatus.DOWN] }, 1, 0],
              },
            },
            averageResponseTime: { $avg: '$responseTimeMs' },
          },
        },
      ],
      cursor: {},
      }),
      this.prisma.monitorCheck.findMany({
        where: {
          monitorId,
          organizationId,
          checkedAt: { gte: ninetyDaysAgo },
        },
        select: { status: true, checkedAt: true },
        orderBy: { checkedAt: 'asc' },
      }),
    ]);

    const daily = new Map<string, { total: number; up: number; failures: number }>();
    const now = new Date();
    for (let offset = 89; offset >= 0; offset--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
      daily.set(date.toISOString().slice(0, 10), { total: 0, up: 0, failures: 0 });
    }
    for (const check of recentChecks) {
      const day = daily.get(check.checkedAt.toISOString().slice(0, 10));
      if (!day) continue;
      day.total++;
      if (check.status === MonitorStatus.UP) day.up++;
      else day.failures++;
    }
    const dailyUptime = Array.from(daily, ([date, values]) => ({
      date,
      uptimePercentage: values.total > 0
        ? Math.round((values.up / values.total) * 10_000) / 100
        : null,
      downDurationMinutes: values.failures > 0
        ? Math.max(1, Math.round((values.failures * monitor.interval) / 60))
        : 0,
      failureCount: values.failures,
    }));

    const aggregate = (
      result as unknown as {
        cursor?: {
          firstBatch?: Array<{
            totalChecks: number;
            successfulChecks: number;
            failedChecks: number;
            averageResponseTime: number | null;
          }>;
        };
      }
    ).cursor?.firstBatch?.[0];

    if (!aggregate || aggregate.totalChecks === 0) {
      return {
        checkSuccessRate: 0,
        averageResponseTime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        latestStatus: monitor.status,
        dailyUptime,
      };
    }

    const { totalChecks, successfulChecks, failedChecks } = aggregate;
    const checkSuccessRate = (successfulChecks / totalChecks) * 100;
    const averageResponseTime = aggregate.averageResponseTime ?? 0;

    return {
      checkSuccessRate: Math.round(checkSuccessRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      totalChecks,
      successfulChecks,
      failedChecks,
      latestStatus: monitor.status,
      dailyUptime,
    };
  }
}
