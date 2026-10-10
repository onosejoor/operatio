import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthCheckScheduler } from './health-check.scheduler';
import { HttpClientService } from '../common/http/http-client.service';

@Module({
  controllers: [HealthController],
  providers: [HealthCheckScheduler, HttpClientService],
})
export class HealthModule {}
