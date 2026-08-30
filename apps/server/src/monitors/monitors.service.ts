import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

const monitorSelect = {
  id: true,
  name: true,
  url: true,
  interval: true,
  timeout: true,
  status: true,
  isActive: true,
} as const;

@Injectable()
export class MonitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createMonitorDto: CreateMonitorDto): Promise<void> {
    await this.prisma.monitor.create({
      data: {
        organizationId,
        ...createMonitorDto,
      },
      select: { id: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.monitor.findMany({
      where: { organizationId },
      select: monitorSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(organizationId: string, monitorId: string) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
      select: monitorSelect,
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    return monitor;
  }

  async update(
    organizationId: string,
    monitorId: string,
    updateMonitorDto: UpdateMonitorDto,
  ): Promise<void> {
    const result = await this.prisma.monitor.updateMany({
      where: { id: monitorId, organizationId },
      data: updateMonitorDto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }

  async disable(organizationId: string, monitorId: string): Promise<void> {
    const result = await this.prisma.monitor.updateMany({
      where: { id: monitorId, organizationId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }
}
