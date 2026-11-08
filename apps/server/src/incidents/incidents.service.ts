import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/database.service';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { PRISMA_TRANSACTION_TIMEOUT } from '@/constants';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private selectFields = {
    id: true,
    monitorId: true,
    organizationId: true,
    publicId: true,
    title: true,
    status: true,
    severity: true,
    publicMessage: true,
    detectedAt: true,
    resolvedAt: true,
    durationMs: true,
    isInternal: true,
    isCustom: true,
    monitor: { select: { name: true } },
    events: {
      select: { type: true, status: true, message: true, createdAt: true },
      orderBy: { createdAt: 'asc' as const },
    },
  };

  private toIncidentResponse(incident: {
    id: string;
    monitorId: string | null;
    organizationId: string;
    publicId: string;
    title: string | null;
    status: string;
    severity: string | null;
    publicMessage: string | null;
    detectedAt: Date;
    resolvedAt: Date | null;
    durationMs: number | null;
    isInternal?: boolean;
    isCustom?: boolean;
    monitor?: { name: string } | null;
    events: Array<{
      type: string;
      status: string | null;
      message: string | null;
      createdAt: Date;
    }>;
  }) {
    return {
      id: incident.id,
      monitorId: incident.monitorId ?? undefined,
      organizationId: incident.organizationId,
      monitorName: incident.monitor?.name ?? 'Internal / General',
      publicId: incident.publicId,
      title: incident.title ?? undefined,
      status: incident.resolvedAt ? 'resolved' : 'active',
      incidentStatus: incident.status,
      severity: incident.severity ?? undefined,
      publicMessage: incident.publicMessage ?? undefined,
      isInternal: incident.isInternal ?? false,
      isCustom: incident.isCustom ?? false,
      startedAt: incident.detectedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
      duration: incident.resolvedAt
        ? Math.floor(
            (incident.resolvedAt.getTime() - incident.detectedAt.getTime()) /
              1000,
          )
        : undefined,
      durationMs: incident.durationMs ?? undefined,
      events:
        incident.events?.map((event) => ({
          type: event.type,
          status: event.status ?? undefined,
          message: event.message ?? undefined,
          createdAt: event.createdAt.toISOString(),
        })) ?? [],
    };
  }

  async getIncidentsForMonitor(
    organizationId: string,
    monitorId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify the monitor belongs to the organization. Inactive monitors retain
    // their history and should remain accessible.
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, organizationId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where: { monitorId },
        select: this.selectFields,
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.incident.count({
        where: { monitorId },
      }),
    ]);

    return {
      data: incidents.map((incident) => this.toIncidentResponse(incident)),
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
        orderBy: { detectedAt: 'desc' },
        select: this.selectFields,
        skip,
        take: limit,
      }),
      this.prisma.incident.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: incidents.map((incident) => this.toIncidentResponse(incident)),
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
      where: { id: incidentId, organizationId },
      select: this.selectFields,
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return this.toIncidentResponse(incident);
  }

  async createCustomIncident(organizationId: string, dto: CreateIncidentDto) {
    if (dto.monitorId) {
      const monitor = await this.prisma.monitor.findFirst({
        where: { id: dto.monitorId, organizationId },
        select: { id: true, name: true },
      });
      if (!monitor) {
        throw new NotFoundException('Monitor not found');
      }
    }

    const publicId = randomUUID();
    const isResolved = dto.status === IncidentStatus.RESOLVED;
    const now = new Date();

    const incident = await this.prisma.$transaction(
      async (tx) => {
        const created = await tx.incident.create({
          data: {
            organizationId,
            monitorId: dto.monitorId ?? null,
            title: dto.title,
            status: dto.status ?? IncidentStatus.INVESTIGATING,
            severity: dto.severity ?? IncidentSeverity.MINOR,
            isInternal: dto.isInternal ?? false,
            isCustom: true,
            publicId,
            publicMessage: dto.message ?? null,
            summary: dto.message ?? null,
            detectedAt: now,
            ...(isResolved ? { resolvedAt: now, durationMs: 0 } : {}),
          },
        });

        await tx.incidentEvent.create({
          data: {
            incidentId: created.id,
            type: 'STATUS_UPDATE',
            status: dto.status ?? IncidentStatus.INVESTIGATING,
            message:
              dto.message ||
              `Incident created with status ${(dto.status ?? IncidentStatus.INVESTIGATING).toLowerCase()}`,
          },
        });

        if (dto.statusPageIds && dto.statusPageIds.length > 0) {
          await tx.incidentStatusPage.createMany({
            data: dto.statusPageIds.map((statusPageId) => ({
              incidentId: created.id,
              statusPageId,
            })),
          });
        }

        return created;
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );

    return { message: 'Incident created successfully' };
  }

  async updateIncidentStatus(
    organizationId: string,
    incidentId: string,
    data: {
      status: IncidentStatus;
      message?: string;
    },
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, organizationId },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const isResolved = data.status === 'RESOLVED';
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Create the new incident event
      await tx.incidentEvent.create({
        data: {
          incidentId,
          status: data.status,
          message:
            data.message ||
            `Incident status updated to ${data.status.toLowerCase()}`,
          type: 'STATUS_UPDATE',
        },
      });

      // 2. Update the incident record
      return tx.incident.update({
        where: { id: incidentId },
        data: {
          status: data.status,
          ...(isResolved && !incident.resolvedAt
            ? {
                resolvedAt: now,
                durationMs: now.getTime() - incident.detectedAt.getTime(),
              }
            : {}),
          ...(!isResolved && incident.resolvedAt
            ? {
                resolvedAt: null,
                durationMs: null,
              }
            : {}),
        },
        select: this.selectFields,
      });
    });

    return this.toIncidentResponse(updated);
  }
}
