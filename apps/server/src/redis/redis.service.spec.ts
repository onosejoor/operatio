import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../config/service/app-config.service';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => {
  const client = {
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
  };

  return {
    __esModule: true,
    default: jest.fn(() => client),
  };
});

describe('RedisService', () => {
  let service: RedisService;
  let appConfigService: { get: jest.Mock };

  beforeEach(async () => {
    appConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'redis.url') return 'redis://localhost:6379';
        if (key === 'redis.username' || key === 'redis.password')
          return undefined;
        return undefined;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: AppConfigService,
          useValue: appConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('uses the configured Redis URL', () => {
    expect(appConfigService.get).toHaveBeenCalledWith('redis.url');
  });

  it('reports healthy when Redis responds with PONG', async () => {
    await expect(service.healthCheck()).resolves.toBe(true);
  });
});
