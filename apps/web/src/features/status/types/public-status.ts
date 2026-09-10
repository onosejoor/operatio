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

export type IncidentLifecycleStatus =
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED';

export type IncidentSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export interface PublicStatusPage {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface DailyUptime {
  date: string;
  uptimePercentage?: number | null;
}

export interface PublicMonitor {
  name: string;
  status: MonitorPerformanceStatus;
  uptime?: number | null;
  responseTime?: number | null;
  lastStatusCode?: number | null;
  dailyUptime?: DailyUptime[];
}

export interface PublicIncidentEvent {
  type: string;
  status?: IncidentLifecycleStatus;
  message?: string;
  createdAt: string;
}

export interface PublicIncident {
  id: string;
  /** Simple binary: 'active' | 'resolved' — for filtering */
  status: 'active' | 'resolved';
  /** Full lifecycle status from backend */
  incidentStatus?: IncidentLifecycleStatus;
  title?: string;
  severity?: IncidentSeverity;
  publicMessage?: string;
  startedAt: string;
  resolvedAt?: string;
  /** Duration in seconds (derived) */
  duration?: number;
  /** Duration in milliseconds (stored by backend on resolve) */
  durationMs?: number;
  events?: PublicIncidentEvent[];
}

export interface PublicStatusResponse {
  statusPage: PublicStatusPage;
  status: OverallStatus;
  monitors: PublicMonitor[];
  incidents: PublicIncident[];
  aggregateUptime?: number | null;
}

export interface MetricsResponse {
  averageLatency?: number;
  successRate?: number;
  activeIncidents?: number;
  averageIncidentDuration?: number;
}
