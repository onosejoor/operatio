import { MonitorStatus } from '@prisma/client';
import { MonitorCheckService } from '../checker/monitor-check.service';
import { HttpClientService } from '../../common/http/http-client.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { PrismaService } from '../../database/database.service';
import { EventType } from '../../shared/events/event-types';
import { AggregateType } from '@prisma/client';

describe('MonitorCheckService', () => {
  const transaction = {
    monitorCheck: { create: jest.fn() },
    monitor: { update: jest.fn() },
  };
  const prisma = {
    monitor: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const httpClient: Pick<HttpClientService, 'get'> = {
    get: jest.fn(),
  };
  const outboxWriter: Pick<OutboxWriter, 'writeTx'> = {
    writeTx: jest.fn(),
  };
  const service = new MonitorCheckService(prisma as never, httpClient as HttpClientService, outboxWriter as OutboxWriter);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );
  });

  it('records a successful HTTP check and updates the monitor state', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 200 });

    await service.execute('monitor-id');

    expect(httpClient.get as jest.Mock).toHaveBeenCalledWith(
      'https://api.example.com/health',
      { timeout: 10_000 },
    );
    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monitorId: 'monitor-id',
        status: MonitorStatus.UP,
        statusCode: 200,
        error: null,
        responseTimeMs: expect.any(Number),
      }),
    });
    expect(transaction.monitor.update).toHaveBeenCalledWith({
      where: { id: 'monitor-id' },
      data: expect.objectContaining({
        status: MonitorStatus.UP,
        lastStatusCode: 200,
        lastResponseTimeMs: expect.any(Number),
        nextCheckAt: expect.any(Date),
      }),
    });
  });

  it('records a DOWN result for an unsuccessful HTTP status', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 503 });

    await service.execute('monitor-id');

    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: MonitorStatus.DOWN,
        statusCode: 503,
        error: null,
      }),
    });
  });

  it('creates status changed event when monitor transitions from UP to DOWN', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 503 });

    await service.execute('monitor-id');

    expect(outboxWriter.writeTx).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        eventType: EventType.MONITOR_STATUS_CHANGED,
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-id',
        payload: expect.objectContaining({
          monitorId: 'monitor-id',
          organizationId: 'org-id',
          previousStatus: MonitorStatus.UP,
          newStatus: MonitorStatus.DOWN,
        }),
      }),
    );
  });

  it('creates status changed event when monitor transitions from DOWN to UP', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.DOWN,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 200 });

    await service.execute('monitor-id');

    expect(outboxWriter.writeTx).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        eventType: EventType.MONITOR_STATUS_CHANGED,
        aggregateType: AggregateType.Monitor,
        aggregateId: 'monitor-id',
        payload: expect.objectContaining({
          monitorId: 'monitor-id',
          organizationId: 'org-id',
          previousStatus: MonitorStatus.DOWN,
          newStatus: MonitorStatus.UP,
        }),
      }),
    );
  });

  it('does not create status changed event when monitor stays DOWN', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.DOWN,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 503 });

    await service.execute('monitor-id');

    expect(outboxWriter.writeTx).not.toHaveBeenCalled();
  });

  it('does not create status changed event when monitor stays UP', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 200 });

    await service.execute('monitor-id');

    expect(outboxWriter.writeTx).not.toHaveBeenCalled();
  });

  it('records a timeout as a DOWN result without an HTTP status', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    const error = new Error('Request timeout');
    (error as any).isAxiosError = true;
    (error as any).code = 'ECONNABORTED';
    (httpClient.get as jest.Mock).mockRejectedValue(error);

    await service.execute('monitor-id');

    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: MonitorStatus.DOWN,
        statusCode: null,
        error: 'Request timeout',
      }),
    });
  });

  it('does not create status changed event when monitor transitions from PENDING', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.PENDING,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockResolvedValue({ status: 200 });

    await service.execute('monitor-id');

    expect(outboxWriter.writeTx).not.toHaveBeenCalled();
  });

  it('records error message for non-axios errors', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });
    (httpClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await service.execute('monitor-id');

    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: MonitorStatus.DOWN,
        statusCode: null,
        error: 'Network error',
      }),
    });
  });

  it('does not request inactive or missing monitors', async () => {
    prisma.monitor.findUnique.mockResolvedValue(null);

    await service.execute('missing-monitor');

    expect(httpClient.get as jest.Mock).not.toHaveBeenCalled();
    expect(transaction.monitorCheck.create).not.toHaveBeenCalled();
  });

  it('does not request inactive monitors', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: false,
      interval: 60,
      status: MonitorStatus.UP,
      organizationId: 'org-id',
      lastCheckedAt: null,
    });

    await service.execute('monitor-id');

    expect(httpClient.get as jest.Mock).not.toHaveBeenCalled();
    expect(transaction.monitorCheck.create).not.toHaveBeenCalled();
  });
});
