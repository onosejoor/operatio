import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpClientService } from '../common/http/http-client.service';
import { AppConfigService } from '../config/service/app-config.service';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, { status: 'up' | 'down' }>;
}

@Injectable()
export class HealthCheckScheduler {
  private readonly logger = new Logger(HealthCheckScheduler.name);

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkHealthEndpoint(): Promise<void> {
    const backendUrl = this.appConfig.get('app.backendUrl').replace(/\/$/, '');
    const url = `${backendUrl}/api/v1/health`;

    try {
      const response = await this.httpClient.get<HealthResponse>(url);
      if (response.status >= 400 || response.data.status !== 'healthy') {
        this.logger.warn(
          `Health endpoint reported ${response.data.status} (HTTP ${response.status}): ${JSON.stringify(response.data.checks)}`,
        );
      } else {
        this.logger.debug(
          `Health endpoint is healthy: ${JSON.stringify(response.data.checks)}`,
        );
      }
    } catch (error) {
      this.logger.error(`Health endpoint request failed: ${url}`, error);
    }
  }
}
