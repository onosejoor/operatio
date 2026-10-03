import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { OrganizationMembershipGuard } from '../common/guards/organization-membership.guard';
import { CurrentOrganizationId } from '../organizations/decorators/current-organization-id.decorator';
import {
  CreateMaintenanceWindowDto,
  UpdateMaintenanceWindowDto,
} from './dto/create-maintenance-window.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@Controller('organizations/:organizationId/maintenance-windows')
@UseGuards(JwtCookieAuthGuard, OrganizationMembershipGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'List an organization’s maintenance windows' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@CurrentOrganizationId() organizationId: string) {
    return ApiResponseDto.success(
      await this.maintenanceService.findAll(organizationId),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a maintenance window' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async create(
    @CurrentOrganizationId() organizationId: string,
    @Body() input: CreateMaintenanceWindowDto,
  ) {
    const result = await this.maintenanceService.create(organizationId, input);
    return ApiResponseDto.success(undefined, result.message);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a maintenance window' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async update(
    @CurrentOrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() input: UpdateMaintenanceWindowDto,
  ) {
    const result = await this.maintenanceService.update(
      organizationId,
      id,
      input,
    );
    return ApiResponseDto.success(undefined, result.message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a maintenance window' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async remove(
    @CurrentOrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const result = await this.maintenanceService.remove(organizationId, id);
    return ApiResponseDto.success(undefined, result.message);
  }
}
