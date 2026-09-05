import { NotFoundException } from '@nestjs/common';
import { MonitorStatus } from '@prisma/client';
import { MonitorsService } from '../monitors.service';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { EventType } from '../../shared/events/event-types';
import { AggregateType } from '@prisma/client';

describe('MonitorsService', () => {
  const transaction = {
    monitor: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const prisma = {
    monitor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    monitorCheck: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const outboxWriter = { write: jest.fn(), writeTx: jest.fn() };
  const service = new MonitorsService(prisma as never, outboxWriter as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );
  });

  it('creates a monitor and writes check requested event', async () => {
    const input = {
      name: 'API',
      url: 'https://api.example.com/health',
      interval: 60,
      timeout: 10_000,
    };
    transaction.monitor.create.mockResolvedValue({ id: 'monitor-id' });

    await expect(
      service.create('organization-id', input),
    ).resolves.toBeUndefined();
    expect(transaction.monitor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-id',
        name: 'API',
        url: 'https://api.example.com/health',
        interval: 60,
        timeout: 10_000,
        nextCheckAt: expect.any(Date),
      }),
      select: { id: true },
    });
    expect(outboxWriter.writeTx).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-id',
        payload: { monitorId: 'monitor-id' },
      }),
    );
  });

  it('lists only monitors for the requested organization', async () => {
    prisma.monitor.findMany.mockResolvedValue([]);

    await service.findAll('organization-id');

    expect(prisma.monitor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'organization-id' } }),
    );
  });

  it('returns a monitor only when it belongs to the organization', async () => {
    const monitor = { id: 'monitor-id', name: 'API' };
    prisma.monitor.findFirst.mockResolvedValue(monitor);

    await expect(
      service.findOne('organization-id', 'monitor-id'),
    ).resolves.toEqual(monitor);
    expect(prisma.monitor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'monitor-id', organizationId: 'organization-id' },
      }),
    );
  });

  it('does not expose a monitor from another organization', async () => {
    prisma.monitor.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('organization-id', 'monitor-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the monitor in one organization-scoped write', async () => {
    const input = { name: 'Renamed API', interval: 120 };
    transaction.monitor.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.update('organization-id', 'monitor-id', input),
    ).resolves.toBeUndefined();
    expect(transaction.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: input,
    });
  });

  it('queues a fresh check when a monitor URL changes', async () => {
    transaction.monitor.findFirst.mockResolvedValue({ interval: 60 });
    transaction.monitor.updateMany.mockResolvedValue({ count: 1 });

    await service.update('organization-id', 'monitor-id', {
      url: 'https://api.example.com/v2/health',
    });

    expect(transaction.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: {
        url: 'https://api.example.com/v2/health',
        status: MonitorStatus.PENDING,
      },
    });
    expect(outboxWriter.writeTx).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-id',
        payload: { monitorId: 'monitor-id' },
      }),
    );
  });

  it('queues a fresh check when monitor is activated', async () => {
    transaction.monitor.updateMany.mockResolvedValue({ count: 1 });

    await service.update('organization-id', 'monitor-id', {
      isActive: true,
    });

    expect(transaction.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: {
        isActive: true,
        status: MonitorStatus.PENDING,
      },
    });
    expect(outboxWriter.writeTx).toHaveBeenCalled();
  });

  it('updates nextCheckAt when interval changes', async () => {
    transaction.monitor.findFirst.mockResolvedValue({ interval: 60 });
    transaction.monitor.updateMany.mockResolvedValue({ count: 1 });

    await service.update('organization-id', 'monitor-id', {
      interval: 120,
    });

    expect(transaction.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: expect.objectContaining({
        interval: 120,
        nextCheckAt: expect.any(Date),
      }),
    });
  });

  it('does not queue check when only name changes', async () => {
    transaction.monitor.updateMany.mockResolvedValue({ count: 1 });

    await service.update('organization-id', 'monitor-id', { name: 'Renamed API' });

    expect(outboxWriter.writeTx).not.toHaveBeenCalled();
  });

  it('reports a missing monitor when no scoped update occurs', async () => {
    transaction.monitor.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update('organization-id', 'monitor-id', { name: 'Renamed API' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('disables a monitor in one organization-scoped write', async () => {
    prisma.monitor.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.disable('organization-id', 'monitor-id'),
    ).resolves.toBeUndefined();
    expect(prisma.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: { isActive: false },
    });
  });

  it('returns paginated check history for a monitor', async () => {
    const checks = [
      { id: 'check-1', status: MonitorStatus.UP, statusCode: 200 },
      { id: 'check-2', status: MonitorStatus.DOWN, statusCode: 503 },
    ];
    prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-id' });
    prisma.monitorCheck.findMany.mockResolvedValue(checks);
    prisma.monitorCheck.count.mockResolvedValue(2);

    const result = await service.getChecks('organization-id', 'monitor-id', 1, 50);

    expect(result).toEqual({
      data: checks,
      meta: {
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  });

  it('filters check history by date range', async () => {
    const checks = [
      { id: 'check-1', status: MonitorStatus.UP, statusCode: 200 },
    ];
    prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-id' });
    prisma.monitorCheck.findMany.mockResolvedValue(checks);
    prisma.monitorCheck.count.mockResolvedValue(1);

    await service.getChecks(
      'organization-id',
      'monitor-id',
      1,
      50,
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
    );

    expect(prisma.monitorCheck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          monitorId: 'monitor-id',
          checkedAt: {
            gte: new Date('2024-01-01T00:00:00Z'),
            lte: new Date('2024-12-31T23:59:59Z'),
          },
        },
      }),
    );
  });

  it('throws NotFoundException when getting checks for non-existent monitor', async () => {
    prisma.monitor.findFirst.mockResolvedValue(null);

    await expect(
      service.getChecks('organization-id', 'monitor-id', 1, 50),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters check history by date range', async () => {
    const checks = [
      { id: 'check-1', status: MonitorStatus.UP, statusCode: 200 },
    ];
    prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-id' });
    prisma.monitorCheck.findMany.mockResolvedValue(checks);
    prisma.monitorCheck.count.mockResolvedValue(1);

    await service.getChecks(
      'organization-id',
      'monitor-id',
      1,
      50,
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
    );

    expect(prisma.monitorCheck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          monitorId: 'monitor-id',
          checkedAt: {
            gte: new Date('2024-01-01T00:00:00Z'),
            lte: new Date('2024-12-31T23:59:59Z'),
          },
        },
      }),
    );
  });

  it('returns stats for a monitor with checks', async () => {
    const checks = [
      { status: MonitorStatus.UP, responseTimeMs: 100 },
      { status: MonitorStatus.UP, responseTimeMs: 150 },
      { status: MonitorStatus.DOWN, responseTimeMs: 200 },
    ];
    prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-id', status: MonitorStatus.UP });
    prisma.monitorCheck.findMany.mockResolvedValue(checks);

    const result = await service.getStats('organization-id', 'monitor-id');

    expect(result).toEqual({
      checkSuccessRate: 66.67,
      averageResponseTime: 150,
      totalChecks: 3,
      successfulChecks: 2,
      failedChecks: 1,
      latestStatus: MonitorStatus.UP,
    });
  });

  it('returns zero stats for a monitor with no checks', async () => {
    prisma.monitor.findFirst.mockResolvedValue({ id: 'monitor-id', status: MonitorStatus.PENDING });
    prisma.monitorCheck.findMany.mockResolvedValue([]);

    const result = await service.getStats('organization-id', 'monitor-id');

    expect(result).toEqual({
      checkSuccessRate: 0,
      averageResponseTime: 0,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      latestStatus: MonitorStatus.PENDING,
    });
  });

  it('throws NotFoundException when getting stats for non-existent monitor', async () => {
    prisma.monitor.findFirst.mockResolvedValue(null);

    await expect(
      service.getStats('organization-id', 'monitor-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
