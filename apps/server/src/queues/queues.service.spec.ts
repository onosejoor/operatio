import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueuesService } from './queues.service';
import { RedisService } from '../redis/redis.service';

describe('QueuesService', () => {
  let service: QueuesService;
  let redisService: { healthCheck: jest.Mock; getClient: jest.Mock };
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    redisService = {
      getClient: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates its health check to Redis', async () => {
    await expect(service.healthCheck()).resolves.toBe(true);
    expect(redisService.healthCheck).toHaveBeenCalledTimes(1);
  });

  it('returns false when Redis health checking fails', async () => {
    redisService.healthCheck.mockRejectedValueOnce(
      new Error('Redis unavailable'),
    );

    await expect(service.healthCheck()).resolves.toBe(false);
  });
});
