import { ApiProperty } from '@nestjs/swagger';

export enum OverallStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  MAJOR_OUTAGE = 'major_outage',
}

export enum MonitorPerformanceStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  SLOW = 'SLOW',
  PENDING = 'PENDING',
}

export class PublicStatusPageDto {
  @ApiProperty({ example: 'Acme Status' })
  name!: string;

  @ApiProperty({ example: 'acme' })
  slug!: string;

  @ApiProperty({ example: 'Current operational status of Acme services', required: false })
  description?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  logo?: string;
}

export class DailyUptimeDto {
  @ApiProperty({ example: '2024-01-15' })
  date!: string;

  @ApiProperty({ example: 99.5, required: false })
  uptimePercentage?: number | null;
}

export class PublicMonitorDto {
  @ApiProperty({ example: 'API' })
  name!: string;

  @ApiProperty({ enum: MonitorPerformanceStatus, example: MonitorPerformanceStatus.UP })
  status!: MonitorPerformanceStatus;

  @ApiProperty({ example: 99.98, required: false, nullable: true })
  uptime?: number | null;

  @ApiProperty({ example: 142, required: false, nullable: true })
  responseTime?: number | null;

  @ApiProperty({ example: 200, required: false, nullable: true })
  lastStatusCode?: number | null;

  @ApiProperty({ type: [DailyUptimeDto], required: false })
  dailyUptime?: DailyUptimeDto[];
}

export class PublicIncidentEventDto {
  @ApiProperty({ enum: ['STATUS_UPDATE', 'NOTE', 'UPDATE'], example: 'STATUS_UPDATE' })
  type!: string;

  @ApiProperty({
    enum: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'],
    example: 'INVESTIGATING',
    required: false,
  })
  status?: string;

  @ApiProperty({ example: 'Incident created due to consecutive monitor failures', required: false })
  message?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt!: string;
}

export class PublicIncidentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['active', 'resolved'], example: 'active' })
  status!: string;

  @ApiProperty({
    enum: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'],
    example: 'INVESTIGATING',
  })
  incidentStatus!: string;

  @ApiProperty({ example: 'API endpoint returning 503', required: false })
  title?: string;

  @ApiProperty({ enum: ['MINOR', 'MAJOR', 'CRITICAL'], example: 'MAJOR', required: false })
  severity?: string;

  @ApiProperty({ example: 'We are investigating an issue with this monitor', required: false })
  publicMessage?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  startedAt!: string;

  @ApiProperty({ example: '2024-01-15T11:30:00Z', required: false })
  resolvedAt?: string;

  @ApiProperty({ example: 3600, required: false })
  duration?: number;

  @ApiProperty({ example: 3600000, required: false })
  durationMs?: number;

  @ApiProperty({ type: [PublicIncidentEventDto] })
  events!: PublicIncidentEventDto[];
}

export class PublicStatusResponseDto {
  @ApiProperty({ type: PublicStatusPageDto })
  statusPage!: PublicStatusPageDto;

  @ApiProperty({ enum: OverallStatus, example: OverallStatus.OPERATIONAL })
  status!: OverallStatus;

  @ApiProperty({ type: [PublicMonitorDto] })
  monitors!: PublicMonitorDto[];

  @ApiProperty({ type: [PublicIncidentDto] })
  incidents!: PublicIncidentDto[];

  @ApiProperty({ example: 99.5, required: false, nullable: true })
  aggregateUptime?: number | null;
}

export class MetricsResponseDto {
  @ApiProperty({ example: 150, required: false })
  averageLatency?: number;

  @ApiProperty({ example: 99.5, required: false })
  successRate?: number;

  @ApiProperty({ example: 2, required: false })
  activeIncidents?: number;

  @ApiProperty({ example: 3600, required: false })
  averageIncidentDuration?: number;
}
