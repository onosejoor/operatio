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
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';
import { StatusPagesService } from './status-pages.service';

@ApiTags('status-pages')
@Controller('organizations/:organizationId/status-pages')
@UseGuards(JwtCookieAuthGuard, OrganizationMembershipGuard)
export class StatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a status page in an organization' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @ApiBody({
    type: CreateStatusPageDto,
    examples: {
      publicStatusPage: {
        summary: 'Public status page',
        value: {
          name: 'Acme Status',
          slug: 'acme',
          isPublic: true,
          description: 'Current operational status of Acme services',
          logo: 'https://example.com/logo.png',
        },
      },
      privateStatusPage: {
        summary: 'Private status page',
        value: {
          name: 'Internal Status',
          slug: 'internal',
          isPublic: false,
          description: 'Internal operational status',
        },
      },
    },
  })
  async create(
    @CurrentOrganizationId() organizationId: string,
    @Body() createStatusPageDto: CreateStatusPageDto,
  ) {
    const statusPage = await this.statusPagesService.create(
      organizationId,
      createStatusPageDto,
    );
    return ApiResponseDto.success(statusPage, 'Status page created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List an organization’s status pages' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@CurrentOrganizationId() organizationId: string) {
    return ApiResponseDto.success(
      await this.statusPagesService.findAll(organizationId),
    );
  }

  @Get(':statusPageId')
  @ApiOperation({ summary: 'Get an organization status page' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, type: ApiResponseDto })
  async findOne(
    @CurrentOrganizationId() organizationId: string,
    @Param('statusPageId') statusPageId: string,
  ) {
    return ApiResponseDto.success(
      await this.statusPagesService.findOne(organizationId, statusPageId),
    );
  }

  @Patch(':statusPageId')
  @ApiOperation({ summary: 'Update an organization status page' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiBody({
    type: UpdateStatusPageDto,
    examples: {
      updateName: {
        summary: 'Update status page name',
        value: { name: 'Updated Acme Status' },
      },
      makePublic: {
        summary: 'Make status page public',
        value: { isPublic: true },
      },
      makePrivate: {
        summary: 'Make status page private',
        value: { isPublic: false },
      },
      updateSlug: {
        summary: 'Update status page slug',
        value: { slug: 'new-slug' },
      },
    },
  })
  async update(
    @CurrentOrganizationId() organizationId: string,
    @Param('statusPageId') statusPageId: string,
    @Body() updateStatusPageDto: UpdateStatusPageDto,
  ) {
    const statusPage = await this.statusPagesService.update(
      organizationId,
      statusPageId,
      updateStatusPageDto,
    );
    return ApiResponseDto.success(statusPage, 'Status page updated successfully');
  }

  @Delete(':statusPageId')
  @ApiOperation({ summary: 'Delete an organization status page' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async delete(
    @CurrentOrganizationId() organizationId: string,
    @Param('statusPageId') statusPageId: string,
  ) {
    await this.statusPagesService.delete(organizationId, statusPageId);
    return ApiResponseDto.success(undefined, 'Status page deleted successfully');
  }
}
