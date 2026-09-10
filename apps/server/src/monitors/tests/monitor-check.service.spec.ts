import {
  MonitorStatus,
  CheckExecutionStatus,
  FailureCode,
} from '@prisma/client';
import { MonitorCheckService } from '../checker/monitor-check.service';
import type {
  NetworkCheckResult,
  AssertionOutcome,
} from '../types/monitor-check.types';
import { HttpClientService } from '../../common/http/http-client.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { PrismaService } from '../../database/database.service';
import { EventType } from '../../shared/events/event-types';
import { AggregateType } from '@prisma/client';
import { AssertionService } from '../telemetry/assertion.service';

const makeService = (
  overrides: Partial<{
    prisma: any;
    httpClient: any;
    outboxWriter: any;
    assertionService: any;
  }> = {},
) => {
  const transaction = {
    monitorCheck: { create: jest.fn(() => ({ id: 'check-id' })) },
    httpTelemetry: { create: jest.fn() },
    assertionResult: { createMany: jest.fn() },
    monitor: { update: jest.fn() },
  };
  const prisma = overrides.prisma ?? {
    monitor: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const httpClient = overrides.httpClient ?? {
    get: jest.fn(),
  };
  const outboxWriter = overrides.outboxWriter ?? {
    writeTx: jest.fn(),
  };
  const assertionService = overrides.assertionService ?? {
    evaluateAssertions: jest.fn(() => []),
  };
  if (!overrides.prisma) {
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    );
  }
  return {
    transaction,
    prisma,
    httpClient,
    outboxWriter,
    assertionService,
    service: new MonitorCheckService(
      prisma as PrismaService,
      httpClient as HttpClientService,
      outboxWriter as OutboxWriter,
      assertionService as AssertionService,
    ),
  };
};

describe('MonitorCheckService', () => {
  describe('resolveFinalResult (pure)', () => {
    const baseNetwork: NetworkCheckResult = {
      status: MonitorStatus.UP,
      executionStatus: CheckExecutionStatus.SUCCESS,
      statusCode: 200,
      responseTimeMs: 120,
      error: null,
      failureCode: null,
      telemetry: { statusCode: 200, responseTimeMs: 120 },
      responseData: { ok: true },
      responseHeaders: { 'content-type': 'application/json' },
    };

    it('returns network result unchanged when no assertions configured', () => {
      const snapshot = structuredClone(baseNetwork);
      const result = MonitorCheckService.resolveFinalResult(baseNetwork, null);
      expect(result.status).toBe(MonitorStatus.UP);
      expect(result.executionStatus).toBe(CheckExecutionStatus.SUCCESS);
      expect(result.failureCode).toBeNull();
      expect(result.error).toBeNull();
      expect(result.assertionFailures).toBeUndefined();
      expect(result.assertionResults).toBeUndefined();
      expect(baseNetwork).toEqual(snapshot);
    });

    it('returns network result unchanged when all assertions pass', () => {
      const snapshot = structuredClone(baseNetwork);
      const outcome: AssertionOutcome = {
        allPassed: true,
        failures: [],
        results: [
          {
            assertionId: 'a-1',
            type: 'STATUS_CODE',
            passed: true,
            expected: '200',
            actual: '200',
            message: 'ok',
          },
        ],
      };
      const result = MonitorCheckService.resolveFinalResult(
        baseNetwork,
        outcome,
      );
      expect(result.status).toBe(MonitorStatus.UP);
      expect(result.executionStatus).toBe(CheckExecutionStatus.SUCCESS);
      expect(result.failureCode).toBeNull();
      expect(result.error).toBeNull();
      expect(result.assertionFailures).toEqual([]);
      expect(result.assertionResults).toEqual(outcome.results);
      expect(baseNetwork).toEqual(snapshot);
    });

    it('overrides status/executionStatus/failureCode/error when any assertion fails and does not mutate input', () => {
      const snapshot = structuredClone(baseNetwork);
      const telemetryRef = baseNetwork.telemetry;
      const dataRef = baseNetwork.responseData;
      const headersRef = baseNetwork.responseHeaders;

      const outcome: AssertionOutcome = {
        allPassed: false,
        failures: [
          { type: 'BODY_CONTAINS', message: 'Response body does not contain "healthy"' },
          { type: 'RESPONSE_TIME', message: 'Response time 120ms does not match <= 100ms' },
        ],
        results: [
          {
            assertionId: 'a-1',
            type: 'STATUS_CODE',
            passed: true,
            expected: '200',
            actual: '200',
            message: 'Status code 200 matches = 200',
          },
          {
            assertionId: 'a-2',
            type: 'BODY_CONTAINS',
            passed: false,
            expected: 'healthy',
            actual: '{"ok":true}',
            message: 'Response body does not contain "healthy"',
          },
          {
            assertionId: 'a-3',
            type: 'RESPONSE_TIME',
            passed: false,
            expected: '100',
            actual: '120',
            message: 'Response time 120ms does not match <= 100ms',
          },
        ],
      };

      const result = MonitorCheckService.resolveFinalResult(
        baseNetwork,
        outcome,
      );

      expect(result.status).toBe(MonitorStatus.DOWN);
      expect(result.executionStatus).toBe(CheckExecutionStatus.FAILED);
      expect(result.failureCode).toBe(FailureCode.ASSERTION_FAILED);
      expect(result.assertionFailures![0].type).toBe('BODY_CONTAINS');
      expect(result.error).toBe(
        'Response body does not contain "healthy", Response time 120ms does not match <= 100ms',
      );
      expect(result.assertionFailures).toEqual(outcome.failures);
      expect(result.assertionResults).toEqual(outcome.results);

      expect(result.statusCode).toBe(baseNetwork.statusCode);
      expect(result.responseTimeMs).toBe(baseNetwork.responseTimeMs);
      expect(result.telemetry).toBe(telemetryRef);
      expect(result.responseData).toBe(dataRef);
      expect(result.responseHeaders).toBe(headersRef);

      expect(baseNetwork).toEqual(snapshot);
    });
  });

  describe('execute (integration-light, mocks only)', () => {
    it('records a successful HTTP check and updates the monitor state', async () => {
      const { service, prisma, httpClient, transaction } = makeService();
      prisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-id',
        url: 'https://api.example.com/health',
        timeout: 10_000,
        isActive: true,
        interval: 60,
        status: MonitorStatus.UP,
        organizationId: 'org-id',
        assertions: [],
      });
      (httpClient.get as jest.Mock).mockResolvedValue({
        status: 200,
        telemetry: { responseTimeMs: 42 },
        data: {},
        headers: {},
      });

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
      const { service, prisma, httpClient, transaction } = makeService();
      prisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-id',
        url: 'https://api.example.com/health',
        timeout: 10_000,
        isActive: true,
        interval: 60,
        status: MonitorStatus.UP,
        organizationId: 'org-id',
        assertions: [],
      });
      (httpClient.get as jest.Mock).mockResolvedValue({
        status: 503,
        telemetry: { responseTimeMs: 10 },
        data: {},
        headers: {},
      });

      await service.execute('monitor-id');

      expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: MonitorStatus.DOWN,
          statusCode: 503,
          error: 'HTTP 503',
        }),
      });
    });

    it('creates status changed event when monitor transitions from UP to DOWN', async () => {
      const { service, prisma, httpClient, outboxWriter, transaction } =
        makeService();
      prisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-id',
        url: 'https://api.example.com/health',
        timeout: 10_000,
        isActive: true,
        interval: 60,
        status: MonitorStatus.UP,
        organizationId: 'org-id',
        assertions: [],
      });
      (httpClient.get as jest.Mock).mockResolvedValue({
        status: 503,
        telemetry: { responseTimeMs: 10 },
        data: {},
        headers: {},
      });

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
      const { service, prisma, httpClient, outboxWriter, transaction } =
        makeService();
      prisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-id',
        url: 'https://api.example.com/health',
        timeout: 10_000,
        isActive: true,
        interval: 60,
        status: MonitorStatus.DOWN,
        organizationId: 'org-id',
        assertions: [],
      });
      (httpClient.get as jest.Mock).mockResolvedValue({
        status: 200,
        telemetry: { responseTimeMs: 10 },
        data: {},
        headers: {},
      });

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

    it('records a timeout as a DOWN result without an HTTP status', async () => {
      const { service, prisma, httpClient, transaction } = makeService();
      prisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-id',
        url: 'https://api.example.com/health',
        timeout: 10_000,
        isActive: true,
        interval: 60,
        status: MonitorStatus.UP,
        organizationId: 'org-id',
        assertions: [],
      });
      const error = new Error('Request timeout');
      (error as any).code = 'ETIMEDOUT';
      (httpClient.get as jest.Mock).mockRejectedValue(error);

      await service.execute('monitor-id');

      expect(transaction.monitorCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: MonitorStatus.DOWN,
          statusCode: null,
          error: 'Request timed out',
          failureCode: FailureCode.TIMEOUT,
        }),
      });
    });
  });
});
