import { Injectable, NotFoundException } from '@nestjs/common';
import { MonitorStatus } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { PERFORMANCE_THRESHOLDS } from '../constants';
import {
  PublicStatusResponseDto,
  OverallStatus,
  PublicMonitorDto,
  PublicIncidentDto,
  PublicStatusPageDto,
  MonitorPerformanceStatus,
} from './dto/public-status.dto';

@Injectable()
export class PublicStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStatus(slug: string): Promise<PublicStatusResponseDto> {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { slug },
      select: {
        id: true,
        organizationId: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        isPublic: true,
      },
    });

    if (!statusPage || !statusPage.isPublic) {
      throw new NotFoundException('Status page not found');
    }

    const [monitors, incidents] = await Promise.all([
      this.getPublicMonitors(statusPage.id),
      this.getPublicIncidents(statusPage.id),
    ]);

    const overallStatus = this.calculateOverallStatus(monitors);

    return {
      statusPage: {
        name: statusPage.name,
        slug: statusPage.slug,
        description: statusPage.description || '',
        logo: statusPage.logo || '',
      },
      status: overallStatus,
      monitors,
      incidents,
    };
  }

  private async getPublicMonitors(
    statusPageId: string,
  ): Promise<PublicMonitorDto[]> {
    const statusPageMonitors = await this.prisma.statusPageMonitor.findMany({
      where: { statusPageId },
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            status: true,
            lastResponseTimeMs: true,
            isPublic: true,
            isActive: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Filter to only include public, active monitors
    const activePublicMonitors = statusPageMonitors
      .filter((spm) => spm.monitor.isPublic && spm.monitor.isActive)
      .map((spm) => spm.monitor);

    const monitorDtos: PublicMonitorDto[] = [];

    for (const monitor of activePublicMonitors) {
      const [uptime, responseTime] = await Promise.all([
        this.calculateUptime(monitor.id),
        this.getLatestResponseTime(monitor.id, monitor.lastResponseTimeMs),
      ]);

      const performanceStatus = this.calculatePerformanceStatus(
        monitor.status,
        responseTime,
      );

      monitorDtos.push({
        name: monitor.name,
        status: performanceStatus,
        uptime,
        responseTime,
      });
    }

    return monitorDtos;
  }

  private async getPublicIncidents(
    statusPageId: string,
  ): Promise<PublicIncidentDto[]> {
    const statusPageMonitors = await this.prisma.statusPageMonitor.findMany({
      where: { statusPageId },
      select: { monitorId: true },
    });

    const monitorIds = statusPageMonitors.map((spm) => spm.monitorId);

    if (monitorIds.length === 0) {
      return [];
    }

    const incidents = await this.prisma.incident.findMany({
      where: {
        monitorId: { in: monitorIds },
      },
      select: {
        id: true,
        startedAt: true,
        resolvedAt: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return incidents.map((incident) => ({
      id: incident.id,
      status: incident.resolvedAt ? 'resolved' : 'active',
      startedAt: incident.startedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
      duration: incident.resolvedAt
        ? Math.floor(
            (incident.resolvedAt.getTime() - incident.startedAt.getTime()) /
              1000,
          )
        : undefined,
    }));
  }

  private calculateOverallStatus(monitors: PublicMonitorDto[]): OverallStatus {
    if (monitors.length === 0) {
      return OverallStatus.OPERATIONAL;
    }

    const downCount = monitors.filter(
      (m) => m.status === MonitorPerformanceStatus.DOWN,
    ).length;
    const slowCount = monitors.filter(
      (m) => m.status === MonitorPerformanceStatus.SLOW,
    ).length;
    const totalCount = monitors.length;

    // Major outage: all monitors are down
    if (downCount === totalCount) {
      return OverallStatus.MAJOR_OUTAGE;
    }

    // Degraded: some monitors are down OR some are slow
    if (downCount > 0 || slowCount > 0) {
      return OverallStatus.DEGRADED;
    }

    // PENDING monitors are treated as operational for overall status
    // (they're being checked, not actually down)
    return OverallStatus.OPERATIONAL;
  }

  private calculatePerformanceStatus(
    status: MonitorStatus,
    responseTime?: number,
  ): MonitorPerformanceStatus {
    // If monitor is DOWN, it's DOWN regardless of response time
    if (status === MonitorStatus.DOWN) {
      return MonitorPerformanceStatus.DOWN;
    }

    // If monitor is PENDING, it's PENDING
    if (status === MonitorStatus.PENDING) {
      return MonitorPerformanceStatus.PENDING;
    }

    // If monitor is UP but response time is slow, mark as SLOW
    if (
      responseTime !== undefined &&
      responseTime >= PERFORMANCE_THRESHOLDS.SLOW_RESPONSE_TIME_MS
    ) {
      return MonitorPerformanceStatus.SLOW;
    }

    // Monitor is UP with acceptable response time
    return MonitorPerformanceStatus.UP;
  }

  private async calculateUptime(monitorId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalChecks, upChecks] = await Promise.all([
      this.prisma.monitorCheck.count({
        where: {
          monitorId,
          checkedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.monitorCheck.count({
        where: {
          monitorId,
          checkedAt: { gte: thirtyDaysAgo },
          status: MonitorStatus.UP,
        },
      }),
    ]);

    if (totalChecks === 0) {
      return 100;
    }

    return Math.round((upChecks / totalChecks) * 10000) / 100;
  }

  private async getLatestResponseTime(
    monitorId: string,
    cachedResponseTime: number | null,
  ): Promise<number | undefined> {
    if (cachedResponseTime !== null) {
      return cachedResponseTime;
    }

    const latestCheck = await this.prisma.monitorCheck.findFirst({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      select: { responseTimeMs: true },
    });

    return latestCheck?.responseTimeMs;
  }
}
