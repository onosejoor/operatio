import { Test, TestingModule } from '@nestjs/testing';
import { MonitorCreatedHandler } from './monitor-created.handler';

describe('MonitorCreatedHandler', () => {
  let handler: MonitorCreatedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitorCreatedHandler],
    }).compile();

    handler = module.get<MonitorCreatedHandler>(MonitorCreatedHandler);
  });

  describe('handle', () => {
    it('should handle monitor created event', async () => {
      const payload = {
        monitorId: 'monitor-123',
        organizationId: 'org-123',
      };

      await expect(handler.handle(payload)).resolves.not.toThrow();
    });

    it('should be idempotent - repeated calls should not cause errors', async () => {
      const payload = {
        monitorId: 'monitor-123',
        organizationId: 'org-123',
      };

      await handler.handle(payload);
      await handler.handle(payload);
      await handler.handle(payload);

      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});
