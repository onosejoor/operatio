import type { AssertionType, AssertionOperator } from '@prisma/client';

export interface HttpTelemetryData {
  statusCode?: number;
  statusText?: string;
  responseTimeMs: number;
  // TODO(telemetry): stub, never populated. Real per-phase timing requires
  // dropping to Node's raw `http`/`https` module to listen on socket events
  // (dns lookup, tcp connect, tls handshake, request write, ttfb, download)
  // or swapping axios for a timing-aware client (e.g. got, fetch with
  // PerformanceObserver). Axios exposes only total response time.
  // Intentionally left undefined at runtime, never persisted as 0.
  dnsMs?: number;
  // TODO(telemetry): stub, never populated — see dnsMs above.
  tcpMs?: number;
  // TODO(telemetry): stub, never populated — see dnsMs above.
  tlsMs?: number;
  // TODO(telemetry): stub, never populated — see dnsMs above.
  requestMs?: number;
  // TODO(telemetry): stub, never populated — see dnsMs above.
  ttfbMs?: number;
  // TODO(telemetry): stub, never populated — see dnsMs above.
  downloadMs?: number;
  // Estimated payload size in bytes: exact value from `content-length` when
  // available, otherwise a best-effort estimate from JSON-stringifying the
  // parsed response body (not the actual wire bytes, and doesn't account for
  // HTTP framing / headers / transfer-encoding / gzip). Use for trend
  // analysis only — do not report as "actual network response size" in UI.
  responseSizeBytesEstimated?: number;
  protocol?: string;
  redirected?: boolean;
  // TODO(telemetry): stub — left undefined when unmeasured (never 0).
  // Real value requires tracking redirect hops explicitly (axios follows
  // transparently); implement via a custom axios interceptor that pushes
  // each intermediate URL onto a stack, or disable axios follow-redirects
  // and walk 3xx manually.
  redirectCount?: number;
  finalUrl?: string;
}

export interface AssertionConfig {
  type: AssertionType;
  expected?: string | number;
  operator?: AssertionOperator;
  key?: string;
  id?: string;
}

export interface AssertionResult {
  type: AssertionType;
  passed: boolean;
  expected?: string;
  actual?: string;
  message?: string;
  assertionId?: string;
}
