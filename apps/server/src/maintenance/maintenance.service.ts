import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import {
  CreateMaintenanceWindowDto,
  UpdateMaintenanceWindowDto,
} from './dto/create-maintenance-window.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.maintenanceWindow.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        statusPage: {
          select: { id: true, name: true, slug: true, isPublic: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async create(organizationId: string, input: CreateMaintenanceWindowDto) {
    this.validateDates(input.startsAt, input.endsAt);
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: input.statusPageId, organizationId },
      select: { id: true },
    });
    if (!statusPage) throw new NotFoundException('Status page not found');
    await this.prisma.maintenanceWindow.create({
      data: {
        organizationId,
        statusPageId: input.statusPageId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      },
      select: { id: true },
    });
    return { message: 'Maintenance scheduled successfully' };
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateMaintenanceWindowDto,
  ) {
    const current = await this.prisma.maintenanceWindow.findFirst({
      where: { id, organizationId },
      select: { startsAt: true, endsAt: true },
    });
    if (!current) throw new NotFoundException('Maintenance window not found');
    const startsAt = input.startsAt ?? current.startsAt.toISOString();
    const endsAt = input.endsAt ?? current.endsAt.toISOString();
    this.validateDates(startsAt, endsAt);
    if (input.statusPageId) {
      const statusPage = await this.prisma.statusPage.findFirst({
        where: { id: input.statusPageId, organizationId },
        select: { id: true },
      });
      if (!statusPage) throw new NotFoundException('Status page not found');
    }
    const result = await this.prisma.maintenanceWindow.updateMany({
      where: { id, organizationId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description.trim() || null,
        }),
        ...(input.startsAt !== undefined && {
          startsAt: new Date(input.startsAt),
        }),
        ...(input.endsAt !== undefined && { endsAt: new Date(input.endsAt) }),
        ...(input.statusPageId !== undefined && {
          statusPageId: input.statusPageId,
        }),
      },
    });
    if (result.count === 0)
      throw new NotFoundException('Maintenance window not found');
    return { message: 'Maintenance updated successfully' };
  }

  async remove(organizationId: string, id: string) {
    const result = await this.prisma.maintenanceWindow.deleteMany({
      where: { id, organizationId },
    });
    if (result.count === 0)
      throw new NotFoundException('Maintenance window not found');
    return { message: 'Maintenance cancelled successfully' };
  }

  private validateDates(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException(
        'Maintenance end time must be after its start time',
      );
    }
  }
}
