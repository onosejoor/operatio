import { Injectable, Logger } from '@nestjs/common';
import {
  MonitorStatus,
  AggregateType,
  CheckExecutionStatus,
  FailureCode,
  Prisma,
} from '@prisma/client';
import { HttpClientService } from '../../common/http/http-client.service';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { EventType } from '../../shared/events/event-types';
import type {
  AssertionOutcome,
  MonitorCheckResult,
  NetworkCheckResult,
} from '../types/monitor-check.types';
import type {
  AssertionConfig,
  AssertionResult as AssertionResultLocal,
  HttpTelemetryData,
} from '../telemetry/http-telemetry.types';
import { PRISMA_TRANSACTION_TIMEOUT, PrismaTransactionType } from '@/constants';
import { normalizeHttpError, getFailureDescription } from '../failure-codes';
import { AssertionService } from '../telemetry/assertion.service';

const MONITOR_WITH_ASSERTIONS_SELECT = {
  id: true,
  url: true,
  timeout: true,
  isActive: true,
  interval: true,
  status: true,
  organizationId: true,
  assertions: {
    where: { isActive: true },
    select: {
      id: true,
      type: true,
      expected: true,
      operator: true,
      key: true,
    },
  },
} as const satisfies Prisma.MonitorSelect;

type MonitorWithAssertions = Prisma.MonitorGetPayload<{
  select: typeof MONITOR_WITH_ASSERTIONS_SELECT;
}>;

@Injectable()
export class MonitorCheckService {
  private logger = new Logger(MonitorCheckService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpClient: HttpClientService,
    private readonly outboxWriter: OutboxWriter,
    private readonly assertionService: AssertionService,
  ) {}

  /**
   * Pure function: given the raw network result and the assertion outcome
   * (null if no assertions configured), produce the final MonitorCheckResult.
   * Never mutates inputs — always returns a new object.
   */
  static resolveFinalResult(
    network: NetworkCheckResult,
    assertions: AssertionOutcome | null,
  ): MonitorCheckResult {
    if (!assertions || assertions.allPassed) {
      return {
        ...network,
        assertionFailures: assertions ? [] : undefined,
        assertionResults: assertions ? assertions.results : undefined,
      };
    }

    const allFailureMessages = assertions.failures.map(
      (f) => f.message || `Assertion ${f?.type ?? ''} failed`,
    );
    return {
      ...network,
      status: MonitorStatus.DOWN,
      executionStatus: CheckExecutionStatus.FAILED,
      failureCode: FailureCode.ASSERTION_FAILED,
      error: allFailureMessages.join(', '),
      assertionFailures: assertions.failures,
      assertionResults: assertions.results,
    };
  }

  async execute(monitorId: string): Promise<void> {
    const monitor = await this.fetchMonitor(monitorId);
    if (!monitor || !monitor.isActive) {
      return;
    }

    const startedAt = new Date();
    const networkResult = await this.requestUrl(monitor.url, monitor.timeout);
    const completedAt = new Date();
    const durationMs = Math.round(completedAt.getTime() - startedAt.getTime());
    const nextCheckAt = new Date(
      completedAt.getTime() + monitor.interval * 1000,
    );

    const assertionOutcome = this.evaluateAssertions(monitor, networkResult);
    const finalResult = MonitorCheckService.resolveFinalResult(
      networkResult,
      assertionOutcome,
    );

    const idempotencyKey = `monitor-check-${monitor.id}-${startedAt.getTime()}`;
    await this.persist(
      monitor,
      idempotencyKey,
      startedAt,
      completedAt,
      durationMs,
      nextCheckAt,
      finalResult,
    );

    this.logger.log(
      `Monitor ${monitor.id} checked: ${finalResult.status} (${finalResult.executionStatus}) in ${finalResult.responseTimeMs}ms`,
    );
  }

  private async fetchMonitor(
    monitorId: string,
  ): Promise<MonitorWithAssertions | null> {
    return this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: MONITOR_WITH_ASSERTIONS_SELECT,
    });
  }

  private evaluateAssertions(
    monitor: MonitorWithAssertions,
    network: NetworkCheckResult,
  ): AssertionOutcome | null {
    if (monitor.assertions.length === 0) {
      return null;
    }

    const configs: AssertionConfig[] = monitor.assertions.map((a) => ({
      type: a.type as AssertionConfig['type'],
      expected: a.expected ?? undefined,
      operator: (a.operator as AssertionConfig['operator']) ?? undefined,
      key: a.key ?? undefined,
      id: a.id,
    }));

    const normalizedHeaders = monitor.assertions.some(
      (a) => a.type === 'HEADER',
    )
      ? this.normalizeHeaders(network.responseHeaders as Record<string, string>)
      : undefined;

    const evaluated: AssertionResultLocal[] =
      this.assertionService.evaluateAssertions(
        configs,
        network.telemetry ?? { responseTimeMs: network.responseTimeMs },
        network.responseData,
        normalizedHeaders,
      );

    const results: Array<AssertionResultLocal & { assertionId: string }> =
      evaluated.map((r) => ({
        ...r,
        assertionId: r.assertionId!,
      }));

    const failures = results
      .filter((r) => !r.passed)
      .map((r) => ({ type: r.type, message: r.message }));

    return {
      allPassed: failures.length === 0,
      failures,
      results,
    };
  }

  private normalizeHeaders(
    rawHeaders: Record<string, string> | undefined,
  ): Record<string, string> {
    if (!rawHeaders) return {};
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      const key = k.toLowerCase();
      if (Array.isArray(v)) {
        normalized[key] = v.join(', ');
      } else if (v == null) {
        normalized[key] = '';
      } else {
        normalized[key] = typeof v === 'string' ? v : String(v);
      }
    }
    return normalized;
  }

  private async persist(
    monitor: MonitorWithAssertions,
    idempotencyKey: string,
    startedAt: Date,
    completedAt: Date,
    durationMs: number,
    nextCheckAt: Date,
    finalResult: MonitorCheckResult,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const check = await tx.monitorCheck.create({
          data: {
            monitorId: monitor.id,
            organizationId: monitor.organizationId,
            status: finalResult.status,
            executionStatus: finalResult.executionStatus,
            statusCode: finalResult.statusCode,
            responseTimeMs: finalResult.responseTimeMs,
            error: finalResult.error,
            failureCode: finalResult.failureCode,
            startedAt,
            completedAt,
            durationMs,
            attempt: 1,
            idempotencyKey,
            checkedAt: completedAt,
          },
        });

        if (finalResult.telemetry) {
          await tx.httpTelemetry.create({
            data: {
              monitorCheckId: check.id,
              ...finalResult.telemetry,
            },
          });
        }

        if (
          finalResult.assertionResults &&
          finalResult.assertionResults.length > 0
        ) {
          await tx.assertionResult.createMany({
            data: finalResult.assertionResults.map((r) => ({
              monitorCheckId: check.id,
              assertionId: r.assertionId,
              type: r.type,
              passed: r.passed,
              expected: r.expected,
              actual: r.actual,
              message: r.message,
            })),
          });
        }

        await this.handleStatusTransition(
          tx,
          monitor.id,
          monitor.organizationId,
          monitor.status,
          finalResult.status,
          completedAt,
        );

        await tx.monitor.update({
          where: { id: monitor.id },
          data: {
            status: finalResult.status,
            lastCheckedAt: completedAt,
            lastStatusCode: finalResult.statusCode,
            lastResponseTimeMs: finalResult.responseTimeMs,
            nextCheckAt,
          },
        });
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );
  }

  private async handleStatusTransition(
    tx: PrismaTransactionType,
    monitorId: string,
    organizationId: string,
    previousStatus: MonitorStatus,
    newStatus: MonitorStatus,
    checkedAt: Date,
  ): Promise<void> {
    if (previousStatus !== newStatus) {
      await this.outboxWriter.writeTx(tx, {
        aggregateType: AggregateType.Monitor,
        idempotencyKey: `monitor-status-changed-${monitorId}-${checkedAt.getTime()}`,
        aggregateId: monitorId,
        eventType: EventType.MONITOR_STATUS_CHANGED,
        payload: {
          monitorId,
          organizationId,
          previousStatus,
          newStatus,
          checkedAt: checkedAt.toISOString(),
        },
      });

      this.logger.log(
        `Monitor ${monitorId} status changed from ${previousStatus} to ${newStatus}`,
      );
    }
  }

  private async requestUrl(
    url: string,
    timeout: number,
  ): Promise<NetworkCheckResult> {
    const startedAt = performance.now();

    try {
      const response = await this.httpClient.get(url, { timeout });
      const status =
        response.status >= 200 && response.status < 400
          ? MonitorStatus.UP
          : MonitorStatus.DOWN;

      const error =
        status === MonitorStatus.DOWN ? `HTTP ${response.status}` : null;

      return {
        status,
        executionStatus: CheckExecutionStatus.SUCCESS,
        statusCode: response.status,
        responseTimeMs: response.telemetry.responseTimeMs,
        error,
        failureCode: null,
        telemetry: response.telemetry,
        responseData: response.data,
        responseHeaders: response.headers,
      };
    } catch (error) {
      const responseTimeMs = Math.round(performance.now() - startedAt);
      const failureCode = normalizeHttpError(error);
      const errorMessage = getFailureDescription(failureCode);

      const telemetry: HttpTelemetryData = {
        responseTimeMs,
      };

      return {
        status: MonitorStatus.DOWN,
        executionStatus:
          failureCode === FailureCode.TIMEOUT
            ? CheckExecutionStatus.TIMEOUT
            : CheckExecutionStatus.FAILED,
        statusCode: null,
        responseTimeMs,
        error: errorMessage,
        failureCode,
        telemetry,
      };
    }
  }
}
