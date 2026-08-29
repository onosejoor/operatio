import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueuesService } from './queues.service';
import { RedisService } from '../redis/redis.service';

describe('QueuesService', () => {
  let service: QueuesService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              return null;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn(() => ({
              on: jest.fn(),
            })),
            healthCheck: jest.fn(async () => true),
          },
        },
      ],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have getQueue method', () => {
    expect(service.getQueue).toBeDefined();
    expect(typeof service.getQueue).toBe('function');
  });

  it('should have createWorker method', () => {
    expect(service.createWorker).toBeDefined();
    expect(typeof service.createWorker).toBe('function');
  });

  it('should have health check method', () => {
    expect(service.healthCheck).toBeDefined();
    expect(typeof service.healthCheck).toBe('function');
  });

  it('should call redis health check for queue health check', async () => {
    const result = await service.healthCheck();
    expect(redisService.healthCheck).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  // Note: Actual queue tests would require a running Redis instance
  // These would be integration tests rather than unit tests
});
