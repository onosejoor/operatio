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

export interface PublicStatusPage {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface PublicMonitor {
  name: string;
  status: MonitorPerformanceStatus;
  uptime?: number;
  responseTime?: number;
}

export interface PublicIncident {
  id: string;
  status: 'active' | 'resolved';
  startedAt: string;
  resolvedAt?: string;
  duration?: number;
}

export interface PublicStatusResponse {
  statusPage: PublicStatusPage;
  status: OverallStatus;
  monitors: PublicMonitor[];
  incidents: PublicIncident[];
}
