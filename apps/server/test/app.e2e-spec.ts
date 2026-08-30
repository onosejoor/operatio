import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/database/database.service';
import { QueuesService } from '../src/queues/queues.service';
import { RedisService } from '../src/redis/redis.service';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: PrismaService,
      useValue: { healthCheck: jest.fn().mockResolvedValue(true) },
    },
    {
      provide: RedisService,
      useValue: { healthCheck: jest.fn().mockResolvedValue(true) },
    },
    {
      provide: QueuesService,
      useValue: { healthCheck: jest.fn().mockResolvedValue(true) },
    },
  ],
})
class HealthTestModule {}

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns the healthy status structure', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      checks: {
        database: { status: 'up' },
        redis: { status: 'up' },
        queues: { status: 'up' },
      },
    });
  });
});
