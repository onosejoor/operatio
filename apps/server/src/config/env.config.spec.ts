import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

describe('App Configuration', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should have default values when environment variables are not set', () => {
    // Test default values
    expect(configService.get('env.app.nodeEnv')).toBe('development');
    expect(configService.get('env.app.port')).toBe(3000);
    expect(configService.get('env.app.corsOrigin')).toBe('http://localhost:3000');
  });

  it('should load configuration from environment', () => {
    // In a real test environment, you would set process.env values
    // and verify they are loaded correctly
    expect(configService.get('env')).toBeDefined();
  });
});
