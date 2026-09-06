import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicStatusController } from '../public-status.controller';
import { PublicStatusService } from '../public-status.service';
import { OverallStatus } from '../dto/public-status.dto';

describe('PublicStatusController', () => {
  let controller: PublicStatusController;
  let service: PublicStatusService;

  const mockPublicStatusResponse = {
    statusPage: {
      name: 'Acme Status',
      slug: 'acme',
      description: 'Current operational status',
      logo: 'https://example.com/logo.png',
    },
    status: OverallStatus.OPERATIONAL,
    monitors: [
      {
        name: 'API',
        status: 'UP',
        uptime: 99.98,
        responseTime: 142,
      },
    ],
    incidents: [],
  };

  const mockService = {
    getPublicStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicStatusController],
      providers: [
        {
          provide: PublicStatusService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PublicStatusController>(PublicStatusController);
    service = module.get<PublicStatusService>(PublicStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicStatus', () => {
    it('returns public status page for valid slug', async () => {
      mockService.getPublicStatus.mockResolvedValue(mockPublicStatusResponse);

      const result = await controller.getPublicStatus('acme');

      expect(result).toEqual(mockPublicStatusResponse);
      expect(service.getPublicStatus).toHaveBeenCalledWith('acme');
    });

    it('throws NotFoundException when status page does not exist', async () => {
      mockService.getPublicStatus.mockRejectedValue(
        new NotFoundException('Status page not found'),
      );

      await expect(controller.getPublicStatus('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when status page is private', async () => {
      mockService.getPublicStatus.mockRejectedValue(
        new NotFoundException('Status page not found'),
      );

      await expect(controller.getPublicStatus('private-slug')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
