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
  DailyUptimeDto,
  MetricsResponseDto,
} from './dto/public-status.dto';

@Injectable()
export class PublicStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStatus(slug: string): Promise<PublicStatusResponseDto> {
    const statusPage = await this.getStatusPage(slug);

    if (!statusPage || !statusPage.isPublic) {
      throw new NotFoundException('Status page not found');
    }

    const [monitors, incidents] = await Promise.all([
      this.getPublicMonitors(statusPage.id),
      this.getPublicIncidents(statusPage.id),
    ]);

    const overallStatus = this.calculateOverallStatus(monitors);

    // Calculate aggregate uptime from all selected monitors' checks
    const monitorIds = await this.getMonitorIds(statusPage.id);
    const aggregateUptime = await this.calculateAggregateUptime(monitorIds);

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
      aggregateUptime,
    };
  }

  async getStatusPage(slug: string) {
    return await this.prisma.statusPage.findUnique({
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
  }

  private async getMonitorIds(statusPageId: string): Promise<string[]> {
    const statusPageMonitors = await this.prisma.statusPageMonitor.findMany({
      where: { statusPageId },
      select: { monitorId: true },
    });
    return statusPageMonitors.map((spm) => spm.monitorId);
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
            isPublic: true,
            isActive: true,
            lastStatusCode: true,
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
      const [uptime, responseTime, dailyUptime] = await Promise.all([
        this.calculateUptime(monitor.id),
        this.calculateAverageResponseTime(monitor.id),
        this.calculateDailyUptime(monitor.id),
      ]);

      const performanceStatus = this.calculatePerformanceStatus(
        monitor.status,
        responseTime ?? undefined,
      );

      monitorDtos.push({
        name: monitor.name,
        status: performanceStatus,
        uptime,
        responseTime: responseTime ?? undefined,
        lastStatusCode: monitor.lastStatusCode ?? undefined,
        dailyUptime,
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
        title: true,
        status: true,
        severity: true,
        publicMessage: true,
        detectedAt: true,
        resolvedAt: true,
        durationMs: true,
        events: {
          select: {
            type: true,
            status: true,
            message: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });

    return incidents.map((incident) => ({
      id: incident.id,
      status: incident.resolvedAt ? 'resolved' : 'active',
      incidentStatus: incident.status,
      title: incident.title ?? undefined,
      severity: incident.severity ?? undefined,
      publicMessage: incident.publicMessage ?? undefined,
      startedAt: incident.detectedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
      duration: incident.resolvedAt
        ? Math.floor(
            (incident.resolvedAt.getTime() - incident.detectedAt.getTime()) /
              1000,
          )
        : undefined,
      durationMs: incident.durationMs ?? undefined,
      events: incident.events.map((e) => ({
        type: e.type,
        status: e.status ?? undefined,
        message: e.message ?? undefined,
        createdAt: e.createdAt.toISOString(),
      })),
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
    responseTime?: number | null,
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
      responseTime !== null &&
      responseTime >= PERFORMANCE_THRESHOLDS.SLOW_RESPONSE_TIME_MS
    ) {
      return MonitorPerformanceStatus.SLOW;
    }

    // Monitor is UP with acceptable response time
    return MonitorPerformanceStatus.UP;
  }

  private async calculateUptime(monitorId: string): Promise<number | null> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [totalChecks, upChecks] = await Promise.all([
      this.prisma.monitorCheck.count({
        where: {
          monitorId,
          checkedAt: { gte: ninetyDaysAgo },
        },
      }),
      this.prisma.monitorCheck.count({
        where: {
          monitorId,
          checkedAt: { gte: ninetyDaysAgo },
          status: MonitorStatus.UP,
        },
      }),
    ]);

    if (totalChecks === 0) {
      return null;
    }

    return Math.round((upChecks / totalChecks) * 10000) / 100;
  }

  private async calculateAggregateUptime(monitorIds: string[]): Promise<number | null> {
    if (monitorIds.length === 0) {
      return null;
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [totalChecks, upChecks] = await Promise.all([
      this.prisma.monitorCheck.count({
        where: {
          monitorId: { in: monitorIds },
          checkedAt: { gte: ninetyDaysAgo },
        },
      }),
      this.prisma.monitorCheck.count({
        where: {
          monitorId: { in: monitorIds },
          checkedAt: { gte: ninetyDaysAgo },
          status: MonitorStatus.UP,
        },
      }),
    ]);

    if (totalChecks === 0) {
      return null;
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

  private async calculateAverageResponseTime(monitorId: string): Promise<number | null> {
    const checks = await this.prisma.monitorCheck.findMany({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      take: 100,
      select: { responseTimeMs: true },
    });

    if (checks.length === 0) {
      return null;
    }

    const totalResponseTime = checks.reduce((sum, c) => sum + c.responseTimeMs, 0);
    return Math.round(totalResponseTime / checks.length);
  }

  private async calculateDailyUptime(
    monitorId: string,
  ): Promise<DailyUptimeDto[]> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Fetch all checks for the 90-day period in a single query
    const allChecks = await this.prisma.monitorCheck.findMany({
      where: {
        monitorId,
        checkedAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        status: true,
        checkedAt: true,
      },
      orderBy: {
        checkedAt: 'asc',
      },
    });

    // Group checks by day and calculate uptime
    const dailyUptime: DailyUptimeDto[] = [];
    const dailyChecks = new Map<string, { total: number; up: number }>();

    // Initialize all 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      dailyChecks.set(dateKey, { total: 0, up: 0 });
    }

    // Aggregate checks by day
    for (const check of allChecks) {
      const dateKey = check.checkedAt.toISOString().split('T')[0];
      const dayData = dailyChecks.get(dateKey);
      if (dayData) {
        dayData.total++;
        if (check.status === MonitorStatus.UP) {
          dayData.up++;
        }
      }
    }

    // Convert to array format
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = dailyChecks.get(dateKey);

      let uptimePercentage: number | null = null;
      if (dayData && dayData.total > 0) {
        uptimePercentage = Math.round((dayData.up / dayData.total) * 10000) / 100;
      }

      dailyUptime.push({
        date: dateKey,
        uptimePercentage,
      });
    }

    return dailyUptime;
  }

  async getMetrics(statusPageId: string): Promise<MetricsResponseDto> {
    const statusPageMonitors = await this.prisma.statusPageMonitor.findMany({
      where: { statusPageId },
      select: { monitorId: true },
    });

    const monitorIds = statusPageMonitors.map((spm) => spm.monitorId);

    if (monitorIds.length === 0) {
      return {};
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Calculate average latency and success rate from recent checks
    const recentChecks = await this.prisma.monitorCheck.findMany({
      where: {
        monitorId: { in: monitorIds },
        checkedAt: { gte: oneHourAgo },
      },
      select: {
        status: true,
        responseTimeMs: true,
      },
    });

    let averageLatency: number | undefined;
    let successRate: number | undefined;

    if (recentChecks.length > 0) {
      const totalResponseTime = recentChecks.reduce(
        (sum, check) => sum + (check.responseTimeMs || 0),
        0,
      );
      averageLatency = Math.round(totalResponseTime / recentChecks.length);

      const upChecks = recentChecks.filter(
        (check) => check.status === MonitorStatus.UP,
      ).length;
      successRate = Math.round((upChecks / recentChecks.length) * 10000) / 100;
    }

    // Calculate incident metrics
    const incidents = await this.prisma.incident.findMany({
      where: {
        monitorId: { in: monitorIds },
        detectedAt: { gte: oneHourAgo },
      },
      select: {
        detectedAt: true,
        resolvedAt: true,
      },
    });

    const activeIncidents = incidents.filter((inc) => !inc.resolvedAt).length;

    let averageIncidentDuration: number | undefined;
    const resolvedIncidents = incidents.filter((inc) => inc.resolvedAt);
    if (resolvedIncidents.length > 0) {
      const totalDuration = resolvedIncidents.reduce(
        (sum, inc) =>
          sum + (inc.resolvedAt!.getTime() - inc.detectedAt.getTime()) / 1000,
        0,
      );
      averageIncidentDuration = Math.round(totalDuration / resolvedIncidents.length);
    }

    return {
      averageLatency,
      successRate,
      activeIncidents,
      averageIncidentDuration,
    };
  }
}
