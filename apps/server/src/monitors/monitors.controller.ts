import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { OrganizationMembershipGuard } from '../common/guards/organization-membership.guard';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { CurrentOrganizationId } from '../organizations/decorators/current-organization-id.decorator';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { MonitorsService } from './monitors.service';

@ApiTags('monitors')
@Controller('organizations/:organizationId/monitors')
@UseGuards(JwtCookieAuthGuard, OrganizationMembershipGuard)
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a monitor in an organization' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @ApiBody({
    type: CreateMonitorDto,
    examples: {
      productionApi: {
        summary: 'Production API health endpoint',
        value: {
          name: 'Production API',
          url: 'https://api.example.com/health',
          interval: 60,
          timeout: 10_000,
        },
      },
    },
  })
  async create(
    @CurrentOrganizationId() organizationId: string,
    @Body() createMonitorDto: CreateMonitorDto,
  ) {
    await this.monitorsService.create(organizationId, createMonitorDto);
    return ApiResponseDto.success(undefined, 'Monitor created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List an organization’s monitors' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@CurrentOrganizationId() organizationId: string) {
    return ApiResponseDto.success(
      await this.monitorsService.findAll(organizationId),
    );
  }

  @Get(':monitorId')
  @ApiOperation({ summary: 'Get an organization monitor' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, type: ApiResponseDto })
  async findOne(
    @CurrentOrganizationId() organizationId: string,
    @Param('monitorId') monitorId: string,
  ) {
    return ApiResponseDto.success(
      await this.monitorsService.findOne(organizationId, monitorId),
    );
  }

  @Patch(':monitorId')
  @ApiOperation({ summary: 'Update an organization monitor' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiBody({
    type: UpdateMonitorDto,
    examples: {
      productionApi: {
        summary: 'Update monitor configuration',
        value: {
          name: 'Production API',
          url: 'https://api.example.com/health',
          interval: 120,
          timeout: 15_000,
          isActive: true,
        },
      },
      updateInterval: {
        summary: 'Update only the check interval',
        value: { interval: 120 },
      },
    },
  })
  async update(
    @CurrentOrganizationId() organizationId: string,
    @Param('monitorId') monitorId: string,
    @Body() updateMonitorDto: UpdateMonitorDto,
  ) {
    await this.monitorsService.update(
      organizationId,
      monitorId,
      updateMonitorDto,
    );
    return ApiResponseDto.success(undefined, 'Monitor updated successfully');
  }

  @Delete(':monitorId')
  @ApiOperation({ summary: 'Disable an organization monitor' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async disable(
    @CurrentOrganizationId() organizationId: string,
    @Param('monitorId') monitorId: string,
  ) {
    await this.monitorsService.disable(organizationId, monitorId);
    return ApiResponseDto.success(undefined, 'Monitor disabled successfully');
  }
}
