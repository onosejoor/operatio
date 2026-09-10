import { MonitorStatus, CheckExecutionStatus, FailureCode } from '@prisma/client';
import {
  HttpTelemetryData,
  AssertionResult as AssertionResultLocal,
} from '../telemetry/http-telemetry.types';

export interface MonitorCheckJobData {
  monitorId: string;
}

export interface NetworkCheckResult {
  status: MonitorStatus;
  executionStatus: CheckExecutionStatus;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
  failureCode: FailureCode | null;
  telemetry?: HttpTelemetryData;
  responseData?: unknown;
  responseHeaders?: Record<string, string | string[] | undefined>;
}

export interface AssertionOutcome {
  allPassed: boolean;
  failures: Array<{ type: string; message?: string }>;
  results: Array<AssertionResultLocal & { assertionId: string }>;
}

export interface MonitorCheckResult extends NetworkCheckResult {
  assertionFailures?: Array<{ type: string; message?: string }>;
  assertionResults?: Array<AssertionResultLocal & { assertionId: string }>;
}
