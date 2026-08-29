import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../config/service/app-config.service';
import { PrismaService } from './database.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let appConfigService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'database.url')
                return 'mongodb://localhost:27017/test';
              if (key === 'app.nodeEnv') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct configuration', () => {
    expect(appConfigService.get('database.url')).toBe(
      'mongodb://localhost:27017/test',
    );
  });

  it('should have health check method', () => {
    expect(service.healthCheck).toBeDefined();
    expect(typeof service.healthCheck).toBe('function');
  });

  // Note: Actual connection tests would require a running MongoDB instance
  // These would be integration tests rather than unit tests
});
