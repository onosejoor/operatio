import { Test, TestingModule } from '@nestjs/testing';
import { MonitorsController } from '../monitors.controller';
import { MonitorsService } from '../monitors.service';
import { CreateMonitorDto } from '../dto/create-monitor.dto';
import { UpdateMonitorDto } from '../dto/update-monitor.dto';
import { MonitorStatus } from '@prisma/client';

describe('MonitorsController', () => {
  let controller: MonitorsController;
  let service: MonitorsService;

  const mockMonitorsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    disable: jest.fn(),
    getChecks: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitorsController],
      providers: [
        {
          provide: MonitorsService,
          useValue: mockMonitorsService,
        },
      ],
    }).compile();

    controller = module.get<MonitorsController>(MonitorsController);
    service = module.get<MonitorsService>(MonitorsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a monitor', async () => {
      const createMonitorDto: CreateMonitorDto = {
        name: 'API Monitor',
        url: 'https://api.example.com/health',
        interval: 60,
        timeout: 10000,
      };

      mockMonitorsService.create.mockResolvedValue(undefined);

      const result = await controller.create('org-1', createMonitorDto);

      expect(service.create).toHaveBeenCalledWith('org-1', createMonitorDto);
      expect(result).toEqual({
        success: true,
        data: undefined,
        message: 'Monitor created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of monitors', async () => {
      const monitors = [
        {
          id: 'monitor-1',
          name: 'API 1',
          url: 'https://api.example.com/health',
          interval: 60,
          timeout: 10000,
          status: MonitorStatus.UP,
          isActive: true,
          lastCheckedAt: new Date(),
          lastStatusCode: 200,
          lastResponseTimeMs: 100,
          nextCheckAt: new Date(),
        },
      ];

      mockMonitorsService.findAll.mockResolvedValue(monitors);

      const result = await controller.findAll('org-1');

      expect(service.findAll).toHaveBeenCalledWith('org-1');
      expect(result).toEqual({
        success: true,
        data: monitors,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single monitor', async () => {
      const monitor = {
        id: 'monitor-1',
        name: 'API 1',
        url: 'https://api.example.com/health',
        interval: 60,
        timeout: 10000,
        status: MonitorStatus.UP,
        isActive: true,
        lastCheckedAt: new Date(),
        lastStatusCode: 200,
        lastResponseTimeMs: 100,
        nextCheckAt: new Date(),
      };

      mockMonitorsService.findOne.mockResolvedValue(monitor);

      const result = await controller.findOne('org-1', 'monitor-1');

      expect(service.findOne).toHaveBeenCalledWith('org-1', 'monitor-1');
      expect(result).toEqual({
        success: true,
        data: monitor,
      });
    });
  });

  describe('update', () => {
    it('should update a monitor', async () => {
      const updateMonitorDto: UpdateMonitorDto = {
        name: 'Updated API',
        interval: 120,
      };

      mockMonitorsService.update.mockResolvedValue(undefined);

      const result = await controller.update('org-1', 'monitor-1', updateMonitorDto);

      expect(service.update).toHaveBeenCalledWith('org-1', 'monitor-1', updateMonitorDto);
      expect(result).toEqual({
        success: true,
        data: undefined,
        message: 'Monitor updated successfully',
      });
    });
  });

  describe('disable', () => {
    it('should disable a monitor', async () => {
      mockMonitorsService.disable.mockResolvedValue(undefined);

      const result = await controller.disable('org-1', 'monitor-1');

      expect(service.disable).toHaveBeenCalledWith('org-1', 'monitor-1');
      expect(result).toEqual({
        success: true,
        data: undefined,
        message: 'Monitor disabled successfully',
      });
    });
  });

  describe('getChecks', () => {
    it('should return paginated check history', async () => {
      const checks = [
        {
          id: 'check-1',
          status: MonitorStatus.UP,
          statusCode: 200,
          responseTimeMs: 100,
          checkedAt: new Date(),
        },
        {
          id: 'check-2',
          status: MonitorStatus.DOWN,
          statusCode: 503,
          responseTimeMs: 200,
          checkedAt: new Date(),
        },
      ];

      mockMonitorsService.getChecks.mockResolvedValue({
        data: checks,
        meta: {
          total: 2,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });

      const result = await controller.getChecks('org-1', 'monitor-1', '1', '50');

      expect(service.getChecks).toHaveBeenCalledWith('org-1', 'monitor-1', 1, 50);
      expect(result).toEqual({
        success: true,
        data: {
          data: checks,
          meta: {
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
          },
        },
      });
    });

    it('should use default pagination values when not provided', async () => {
      mockMonitorsService.getChecks.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        },
      });

      await controller.getChecks('org-1', 'monitor-1');

      expect(service.getChecks).toHaveBeenCalledWith('org-1', 'monitor-1', 1, 50);
    });
  });

  describe('getStats', () => {
    it('should return monitor statistics', async () => {
      const stats = {
        checkSuccessRate: 95.5,
        averageResponseTime: 150,
        totalChecks: 100,
        successfulChecks: 95,
        failedChecks: 5,
        latestStatus: MonitorStatus.UP,
      };

      mockMonitorsService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats('org-1', 'monitor-1');

      expect(service.getStats).toHaveBeenCalledWith('org-1', 'monitor-1');
      expect(result).toEqual({
        success: true,
        data: stats,
      });
    });
  });
});
