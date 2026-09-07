import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicStatusService } from './public-status.service';
import { PublicStatusResponseDto } from './dto/public-status.dto';
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
}
