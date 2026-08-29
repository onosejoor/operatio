import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { QueuesService } from '../queues/queues.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly queuesService: QueuesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const [dbHealthy, redisHealthy, queuesHealthy] = await Promise.all([
      this.prisma.healthCheck(),
      this.redisService.healthCheck(),
      this.queuesService.healthCheck(),
    ]);

    const overallHealthy = dbHealthy && redisHealthy && queuesHealthy;

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbHealthy ? 'up' : 'down',
        },
        redis: {
          status: redisHealthy ? 'up' : 'down',
        },
        queues: {
          status: queuesHealthy ? 'up' : 'down',
        },
      },
    };
  }
}
