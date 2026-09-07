import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicStatusService } from './public-status.service';
import {
  PublicStatusResponseDto,
  MetricsResponseDto,
} from './dto/public-status.dto';
import { ApiResponseDto } from '@/common/dto/api-response.dto';

@ApiTags('public-status')
@Controller('public/status')
export class PublicStatusController {
  constructor(private readonly publicStatusService: PublicStatusService) {}

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public status page by slug' })
  @ApiResponse({
    status: 200,
    description: 'Public status page retrieved successfully',
    type: ApiResponseDto<PublicStatusResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Status page not found or not public',
  })
  async getPublicStatus(
    @Param('slug') slug: string,
  ): Promise<ApiResponseDto<PublicStatusResponseDto>> {
    return ApiResponseDto.success(
      await this.publicStatusService.getPublicStatus(slug),
    );
  }

  @Get(':slug/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public status page metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    type: ApiResponseDto<MetricsResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Status page not found or not public',
  })
  async getMetrics(
    @Param('slug') slug: string,
  ): Promise<ApiResponseDto<MetricsResponseDto>> {
    const statusPage = await this.publicStatusService.getStatusPage(slug);

    if (!statusPage || !statusPage.isPublic) {
      throw new NotFoundException('Status page not found');
    }

    return ApiResponseDto.success(
      await this.publicStatusService.getMetrics(statusPage.id),
    );
  }
}
