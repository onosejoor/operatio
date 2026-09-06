import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/database.service';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private selectFields = {
    id: true,
    monitorId: true,
    organizationId: true,
    startedAt: true,
    resolvedAt: true,
  };

  async getIncidentsForMonitor(
    organizationId: string,
    monitorId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify monitor belongs to organization and is active
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId, isActive: true },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where: { monitorId },
        select: this.selectFields,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.incident.count({
        where: { monitorId },
      }),
    ]);

    return {
      data: incidents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getIncidentsForOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where: { organizationId },
        orderBy: { startedAt: 'desc' },
        select: this.selectFields,
        skip,
        take: limit,
      }),
      this.prisma.incident.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: incidents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getIncidentById(organizationId: string, incidentId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: {
        id: incidentId,
        organizationId,
      },
      select: this.selectFields,
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }
}
