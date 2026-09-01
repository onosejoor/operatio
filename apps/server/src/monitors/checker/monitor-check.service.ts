import { Injectable, Logger } from '@nestjs/common';
import { MonitorStatus } from '@prisma/client';
import axios from 'axios';
import { HttpClientService } from '../../common/http/http-client.service';
import { PrismaService } from '../../database/database.service';
import type { MonitorCheckResult } from '../types/monitor-check.types';

@Injectable()
export class MonitorCheckService {
  private logger = new Logger(MonitorCheckService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpClient: HttpClientService,
  ) { }

  async execute(monitorId: string): Promise<void> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { id: true, url: true, timeout: true, isActive: true },
    });

    if (!monitor || !monitor.isActive) {
      return;
    }

    const result = await this.requestUrl(monitor.url, monitor.timeout);
    const checkedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      await transaction.monitorCheck.create({
        data: {
          monitorId: monitor.id,
          ...result,
          checkedAt,
        },
      });
      await transaction.monitor.update({
        where: { id: monitor.id },
        data: {
          status: result.status,
          lastCheckedAt: checkedAt,
          lastStatusCode: result.statusCode,
          lastResponseTimeMs: result.responseTimeMs,
        },
      });
    });

    this.logger.log(
      `Monitor ${monitor.id} checked: ${result.status} in ${result.responseTimeMs}ms`,
    );
  }

  private async requestUrl(
    url: string,
    timeout: number,
  ): Promise<MonitorCheckResult> {
    const startedAt = performance.now();

    try {
      const response = await this.httpClient.get(url, { timeout });
      const responseTimeMs = Math.round(performance.now() - startedAt);
      const status =
        response.status >= 200 && response.status < 400
          ? MonitorStatus.UP
          : MonitorStatus.DOWN;

      return {
        status,
        statusCode: response.status,
        responseTimeMs,
        error: null,
      };
    } catch (error) {
      const responseTimeMs = Math.round(performance.now() - startedAt);

      return {
        status: MonitorStatus.DOWN,
        statusCode: null,
        responseTimeMs,
        error: this.getFailureReason(error),
      };
    }
  }

  private getFailureReason(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.message || error.code || ""
    }

    return error instanceof Error ? error.message : 'Request failed';
  }
}
