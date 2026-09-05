import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { QueryDto } from '../common/dto/query.dto';
import { OrganizationMembershipGuard } from '../common/guards/organization-membership.guard';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { CurrentOrganizationId } from '../organizations/decorators/current-organization-id.decorator';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('organizations/:organizationId/monitors/:monitorId/incidents')
@UseGuards(JwtCookieAuthGuard, OrganizationMembershipGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'List incidents for a monitor' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getIncidentsForMonitor(
    @CurrentOrganizationId() organizationId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: QueryDto,
  ) {
    return ApiResponseDto.success(
      await this.incidentsService.getIncidentsForMonitor(
        organizationId,
        monitorId,
        query.page,
        query.limit,
      ),
    );
  }
}

@ApiTags('incidents')
@Controller('organizations/:organizationId/incidents')
@UseGuards(JwtCookieAuthGuard, OrganizationMembershipGuard)
export class OrganizationIncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all incidents for an organization' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getIncidentsForOrganization(
    @CurrentOrganizationId() organizationId: string,
    @Query() query: QueryDto,
  ) {
    return ApiResponseDto.success(
      await this.incidentsService.getIncidentsForOrganization(
        organizationId,
        query.page,
        query.limit,
      ),
    );
  }

  @Get(':incidentId')
  @ApiOperation({ summary: 'Get a specific incident' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, type: ApiResponseDto })
  async getIncidentById(
    @CurrentOrganizationId() organizationId: string,
    @Param('incidentId') incidentId: string,
  ) {
    return ApiResponseDto.success(
      await this.incidentsService.getIncidentById(organizationId, incidentId),
    );
  }
}
