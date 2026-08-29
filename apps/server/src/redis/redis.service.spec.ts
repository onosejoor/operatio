import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../config/service/app-config.service';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let appConfigService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'redis.url') return 'redis://localhost:6379';
              if (key === 'redis.username') return null;
              if (key === 'redis.password') return null;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct configuration', () => {
    expect(appConfigService.get('redis.url')).toBe('redis://localhost:6379');
  });

  it('should have health check method', () => {
    expect(service.healthCheck).toBeDefined();
    expect(typeof service.healthCheck).toBe('function');
  });

  it('should have getClient method', () => {
    expect(service.getClient).toBeDefined();
    expect(typeof service.getClient).toBe('function');
  });

  // Note: Actual connection tests would require a running Redis instance
  // These would be integration tests rather than unit tests
});
