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

export class PublicMonitorDto {
  @ApiProperty({ example: 'API' })
  name!: string;

  @ApiProperty({ enum: MonitorPerformanceStatus, example: MonitorPerformanceStatus.UP })
  status!: MonitorPerformanceStatus;

  @ApiProperty({ example: 99.98, required: false })
  uptime?: number;

  @ApiProperty({ example: 142, required: false })
  responseTime?: number;
}

export class PublicIncidentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['active', 'resolved'], example: 'active' })
  status!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  startedAt!: string;

  @ApiProperty({ example: '2024-01-15T11:30:00Z', required: false })
  resolvedAt?: string;

  @ApiProperty({ example: 3600, required: false })
  duration?: number;
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
}
