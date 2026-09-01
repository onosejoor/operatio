import { MonitorStatus } from '@prisma/client';

export interface MonitorCheckJobData {
  monitorId: string;
}

export interface MonitorCheckResult {
  status: MonitorStatus;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}
