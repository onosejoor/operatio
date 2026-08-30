import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { OrganizationMembershipGuard } from '../common/guards/organization-membership.guard';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtCookieAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations available to the current user' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return ApiResponseDto.success(
      await this.organizationsService.findAllForUser(user.id),
    );
  }

  @Get(':id')
  @UseGuards(OrganizationMembershipGuard)
  @ApiOperation({ summary: 'Get an organization the current user belongs to' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 403, type: ApiResponseDto })
  @ApiResponse({ status: 404, type: ApiResponseDto })
  async findOne(@Param('id') id: string) {
    return ApiResponseDto.success(await this.organizationsService.findOne(id));
  }
}
