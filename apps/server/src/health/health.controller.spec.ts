import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { QueuesService } from '../queues/queues.service';

describe('HealthController', () => {
  let controller: HealthController;
  let PrismaService: PrismaService;
  let redisService: RedisService;
  let queuesService: QueuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            healthCheck: jest.fn(async () => true),
          },
        },
        {
          provide: RedisService,
          useValue: {
            healthCheck: jest.fn(async () => true),
          },
        },
        {
          provide: QueuesService,
          useValue: {
            healthCheck: jest.fn(async () => true),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    PrismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    queuesService = module.get<QueuesService>(QueuesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy status when all services are up', async () => {
    jest.spyOn(PrismaService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(redisService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(queuesService, 'healthCheck').mockResolvedValue(true);

    const result = await controller.check();

    expect(result.status).toBe('healthy');
    expect(result.checks.database.status).toBe('up');
    expect(result.checks.redis.status).toBe('up');
    expect(result.checks.queues.status).toBe('up');
    expect(result.timestamp).toBeDefined();
  });

  it('should return unhealthy status when database is down', async () => {
    jest.spyOn(PrismaService, 'healthCheck').mockResolvedValue(false);
    jest.spyOn(redisService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(queuesService, 'healthCheck').mockResolvedValue(true);

    const result = await controller.check();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.database.status).toBe('down');
  });

  it('should return unhealthy status when redis is down', async () => {
    jest.spyOn(PrismaService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(redisService, 'healthCheck').mockResolvedValue(false);
    jest.spyOn(queuesService, 'healthCheck').mockResolvedValue(true);

    const result = await controller.check();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.redis.status).toBe('down');
  });

  it('should return unhealthy status when queues are down', async () => {
    jest.spyOn(PrismaService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(redisService, 'healthCheck').mockResolvedValue(true);
    jest.spyOn(queuesService, 'healthCheck').mockResolvedValue(false);

    const result = await controller.check();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.queues.status).toBe('down');
  });

  it('should call all health check services', async () => {
    await controller.check();

    expect(PrismaService.healthCheck).toHaveBeenCalled();
    expect(redisService.healthCheck).toHaveBeenCalled();
    expect(queuesService.healthCheck).toHaveBeenCalled();
  });
});
