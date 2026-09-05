import { MonitorSchedulerService } from '../scheduler/monitor-scheduler.service';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { EventType } from '../../shared/events/event-types';
import { AggregateType } from '@prisma/client';

describe('MonitorSchedulerService', () => {
  const prisma = {
    monitor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const outboxWriter = { write: jest.fn() };
  const service = new MonitorSchedulerService(prisma as never, outboxWriter as never);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('finds and schedules monitors due for checking', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const dueMonitors = [
      {
        id: 'monitor-1',
        name: 'API 1',
        interval: 60,
        nextCheckAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'monitor-2',
        name: 'API 2',
        interval: 120,
        nextCheckAt: new Date('2024-01-01T00:00:00Z'),
      },
    ];

    prisma.monitor.findMany.mockResolvedValue(dueMonitors);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: dueMonitors[0].nextCheckAt,
            isActive: true,
          }),
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(prisma.monitor.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        nextCheckAt: { lte: now },
      },
      select: {
        id: true,
        name: true,
        interval: true,
        nextCheckAt: true,
      },
    });
  });

  it('returns early when no monitors are due', async () => {
    prisma.monitor.findMany.mockResolvedValue([]);

    await service.scheduleMonitorChecks();

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(outboxWriter.write).not.toHaveBeenCalled();
  });

  it('claims monitor check by verifying nextCheckAt has not changed', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: monitor.nextCheckAt,
            isActive: true,
          }),
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.MONITOR_CHECK_REQUESTED,
        aggregateType: AggregateType.Monitor,
        aggregateId: monitor.id,
        payload: { monitorId: monitor.id },
      }),
    );
  });

  it('does not claim check if monitor was already claimed by another scheduler', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: new Date('2024-01-01T00:01:00Z'), // Changed by another scheduler
            isActive: true,
          }),
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(outboxWriter.write).not.toHaveBeenCalled();
  });

  it('does not claim check if monitor is no longer active', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: monitor.nextCheckAt,
            isActive: false, // Deactivated
          }),
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(outboxWriter.write).not.toHaveBeenCalled();
  });

  it('does not claim check if monitor no longer exists', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue(null), // Deleted
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(outboxWriter.write).not.toHaveBeenCalled();
  });

  it('updates nextCheckAt when claiming a monitor', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    const updateMock = jest.fn();
    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: monitor.nextCheckAt,
            isActive: true,
          }),
          update: updateMock,
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: monitor.id },
      data: {
        nextCheckAt: new Date(now.getTime() + monitor.interval * 1000),
      },
    });
  });

  it('handles errors for individual monitors without stopping the batch', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const dueMonitors = [
      {
        id: 'monitor-1',
        name: 'API 1',
        interval: 60,
        nextCheckAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'monitor-2',
        name: 'API 2',
        interval: 120,
        nextCheckAt: new Date('2024-01-01T00:00:00Z'),
      },
    ];

    prisma.monitor.findMany.mockResolvedValue(dueMonitors);
    prisma.$transaction
      .mockImplementationOnce(async (callback) => {
        return callback({
          monitor: {
            findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
            update: jest.fn(),
          },
        });
      })
      .mockImplementationOnce(async (callback) => {
        return callback({
          monitor: {
            findUnique: jest.fn().mockResolvedValue({
              nextCheckAt: dueMonitors[1].nextCheckAt,
              isActive: true,
            }),
            update: jest.fn(),
          },
        });
      });

    await service.scheduleMonitorChecks();

    expect(outboxWriter.write).toHaveBeenCalledTimes(1);
  });

  it('handles errors in the main scheduler gracefully', async () => {
    prisma.monitor.findMany.mockRejectedValue(new Error('Database connection failed'));

    await expect(service.scheduleMonitorChecks()).resolves.not.toThrow();
  });

  it('generates unique idempotency key for each check request', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(now);

    const monitor = {
      id: 'monitor-1',
      name: 'API 1',
      interval: 60,
      nextCheckAt: new Date('2024-01-01T00:00:00Z'),
    };

    prisma.monitor.findMany.mockResolvedValue([monitor]);
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        monitor: {
          findUnique: jest.fn().mockResolvedValue({
            nextCheckAt: monitor.nextCheckAt,
            isActive: true,
          }),
          update: jest.fn(),
        },
      });
    });

    await service.scheduleMonitorChecks();

    expect(outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^monitor-check-requested-monitor-1-\d+$/),
      }),
    );
  });
});
