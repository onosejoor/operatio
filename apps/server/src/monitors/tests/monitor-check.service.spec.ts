import { MonitorStatus } from '@prisma/client';
import { MonitorCheckService } from '../checker/monitor-check.service';
import { HttpClientService } from '../../common/http/http-client.service';

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
  const service = new MonitorCheckService(prisma as never, httpClient as HttpClientService);

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
      }),
    });
  });

  it('records a DOWN result for an unsuccessful HTTP status', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
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

  it('records a timeout as a DOWN result without an HTTP status', async () => {
    prisma.monitor.findUnique.mockResolvedValue({
      id: 'monitor-id',
      url: 'https://api.example.com/health',
      timeout: 10_000,
      isActive: true,
    });
    (httpClient.get as jest.Mock).mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED' });

    await service.execute('monitor-id');

    expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: MonitorStatus.DOWN,
        statusCode: null,
        error: 'Request timed out',
      }),
    });
  });

  it('does not request inactive or missing monitors', async () => {
    prisma.monitor.findUnique.mockResolvedValue(null);

    await service.execute('missing-monitor');

    expect(httpClient.get as jest.Mock).not.toHaveBeenCalled();
    expect(transaction.monitorCheck.create).not.toHaveBeenCalled();
  });
});
