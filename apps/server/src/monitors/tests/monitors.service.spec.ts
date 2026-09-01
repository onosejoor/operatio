import { NotFoundException } from '@nestjs/common';
import { MonitorStatus } from '@prisma/client';
import { MonitorsService } from '../monitors.service';

describe('MonitorsService', () => {
  const transaction = {
    monitor: { create: jest.fn() },
  };
  const prisma = {
    monitor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const monitorCheckQueue = { enqueue: jest.fn() };
  const outboxWriter = { writeTx: jest.fn() };
  const service = new MonitorsService(prisma as never, monitorCheckQueue as never, outboxWriter as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );
  });

  it('creates a monitor and queues its initial check', async () => {
    const input = {
      name: 'API',
      url: 'https://api.example.com/health',
      interval: 60,
      timeout: 10_000,
    };
    prisma.monitor.create.mockResolvedValue({ id: 'monitor-id' });

    await expect(
      service.create('organization-id', input),
    ).resolves.toBeUndefined();
    expect(prisma.monitor.create).toHaveBeenCalledWith({
      data: { organizationId: 'organization-id', ...input },
      select: { id: true },
    });
    expect(monitorCheckQueue.enqueue).toHaveBeenCalledWith('monitor-id');
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
    prisma.monitor.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.update('organization-id', 'monitor-id', input),
    ).resolves.toBeUndefined();
    expect(prisma.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: input,
    });
  });

  it('queues a fresh check when a monitor URL changes', async () => {
    prisma.monitor.updateMany.mockResolvedValue({ count: 1 });

    await service.update('organization-id', 'monitor-id', {
      url: 'https://api.example.com/v2/health',
    });

    expect(prisma.monitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'monitor-id', organizationId: 'organization-id' },
      data: {
        url: 'https://api.example.com/v2/health',
        status: MonitorStatus.PENDING,
      },
    });
    expect(monitorCheckQueue.enqueue).toHaveBeenCalledWith('monitor-id');
  });

  it('reports a missing monitor when no scoped update occurs', async () => {
    prisma.monitor.updateMany.mockResolvedValue({ count: 0 });

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
});
