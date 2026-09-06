import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';
import { AddMonitorToStatusPageDto } from './dto/add-monitor.dto';

@Injectable()
export class StatusPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createStatusPageDto: CreateStatusPageDto,
  ) {
    const existingSlug = await this.prisma.statusPage.findUnique({
      where: { slug: createStatusPageDto.slug },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already taken');
    }

    const statusPage = await this.prisma.statusPage.create({
      data: {
        organizationId,
        ...createStatusPageDto,
      },
      select: { id: true },
    });

    return { id: statusPage.id };
  }

  async findAll(organizationId: string) {
    return this.prisma.statusPage.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, statusPageId: string) {
    const statusPage = await this.prisma.statusPage.findFirst({
      where: {
        id: statusPageId,
        organizationId,
      },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    return statusPage;
  }

  async update(
    organizationId: string,
    statusPageId: string,
    updateStatusPageDto: UpdateStatusPageDto,
  ) {
    if (updateStatusPageDto.slug) {
      const existingSlug = await this.prisma.statusPage.findFirst({
        where: {
          slug: updateStatusPageDto.slug,
          id: { not: statusPageId },
        },
        select: { id: true },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already taken');
      }
    }

    const result = await this.prisma.statusPage.updateMany({
      where: {
        id: statusPageId,
        organizationId,
      },
      data: updateStatusPageDto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Status page not found');
    }

    return { id: statusPageId };
  }

  async delete(organizationId: string, statusPageId: string) {
    const result = await this.prisma.statusPage.deleteMany({
      where: {
        id: statusPageId,
        organizationId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Status page not found');
    }
  }

  async addMonitor(
    organizationId: string,
    statusPageId: string,
    addMonitorDto: AddMonitorToStatusPageDto,
  ) {
    // Verify status page belongs to organization
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    // Verify monitor belongs to organization
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: addMonitorDto.monitorId, organizationId },
      select: { id: true },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    // Check if monitor is already on the status page
    const existing = await this.prisma.statusPageMonitor.findFirst({
      where: {
        statusPageId,
        monitorId: addMonitorDto.monitorId,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Monitor is already on this status page');
    }

    const statusPageMonitor = await this.prisma.statusPageMonitor.create({
      data: {
        statusPageId,
        monitorId: addMonitorDto.monitorId,
        order: addMonitorDto.order,
      },
      select: { id: true },
    });

    return { id: statusPageMonitor.id };
  }

  async removeMonitor(
    organizationId: string,
    statusPageId: string,
    monitorId: string,
  ) {
    // Verify status page belongs to organization
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    const result = await this.prisma.statusPageMonitor.deleteMany({
      where: {
        statusPageId,
        monitorId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found on this status page');
    }

    return { message: 'Monitor removed from status page' };
  }

  async getMonitors(organizationId: string, statusPageId: string) {
    // Verify status page belongs to organization
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    return this.prisma.statusPageMonitor.findMany({
      where: { statusPageId },
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
            isActive: true,
            isPublic: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateMonitorOrder(
    organizationId: string,
    statusPageId: string,
    monitorId: string,
    order: number,
  ) {
    // Verify status page belongs to organization
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    const result = await this.prisma.statusPageMonitor.updateMany({
      where: {
        statusPageId,
        monitorId,
      },
      data: { order },
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found on this status page');
    }

    return { message: 'Monitor order updated' };
  }
}
