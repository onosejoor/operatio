/**
 * Failure code constants and error normalization utilities.
 * Maps Node.js/network errors to stable Upwatch failure codes.
 */

import { FailureCode } from '@prisma/client';

export const FAILURE_CODES = {
  HTTP_ERROR: FailureCode.HTTP_ERROR,
  TIMEOUT: FailureCode.TIMEOUT,
  DNS_ERROR: FailureCode.DNS_ERROR,
  CONNECTION_REFUSED: FailureCode.CONNECTION_REFUSED,
  CONNECTION_RESET: FailureCode.CONNECTION_RESET,
  TLS_ERROR: FailureCode.TLS_ERROR,
  NETWORK_ERROR: FailureCode.NETWORK_ERROR,
  ASSERTION_FAILED: FailureCode.ASSERTION_FAILED,
  UNKNOWN_ERROR: FailureCode.UNKNOWN_ERROR,
} as const;

/**
 * Normalize a Node.js error to a stable Upwatch failure code.
 * @param error - The error object or error code
 * @returns Normalized failure code
 */
export function normalizeHttpError(error: unknown): FailureCode {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '').toLowerCase()
        : '';

  if (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    message.includes('timeout')
  ) {
    return FailureCode.TIMEOUT;
  }

  if (code === 'ENOTFOUND' || code === 'ENODATA' || message.includes('dns')) {
    return FailureCode.DNS_ERROR;
  }

  if (code === 'ECONNREFUSED' || message.includes('connection refused')) {
    return FailureCode.CONNECTION_REFUSED;
  }

  if (
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    message.includes('connection reset')
  ) {
    return FailureCode.CONNECTION_RESET;
  }

  if (
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'EPROTO' ||
    message.includes('tls') ||
    message.includes('ssl') ||
    message.includes('certificate')
  ) {
    return FailureCode.TLS_ERROR;
  }

  if (
    code === 'ENETUNREACH' ||
    code === 'EHOSTUNREACH' ||
    code === 'EAI_AGAIN' ||
    message.includes('network')
  ) {
    return FailureCode.NETWORK_ERROR;
  }

  return FailureCode.UNKNOWN_ERROR;
}

/**
 * Get a human-readable description for a failure code.
 * @param code - The failure code
 * @returns Human-readable description
 */
export function getFailureDescription(code: FailureCode): string {
  const descriptions: Record<FailureCode, string> = {
    [FailureCode.HTTP_ERROR]: 'HTTP error response',
    [FailureCode.TIMEOUT]: 'Request timed out',
    [FailureCode.DNS_ERROR]: 'DNS resolution failed',
    [FailureCode.CONNECTION_REFUSED]: 'Connection refused',
    [FailureCode.CONNECTION_RESET]: 'Connection reset',
    [FailureCode.TLS_ERROR]: 'TLS/SSL error',
    [FailureCode.NETWORK_ERROR]: 'Network error',
    [FailureCode.ASSERTION_FAILED]: 'Assertion failed',
    [FailureCode.UNKNOWN_ERROR]: 'Unknown error',
  };

  return descriptions[code] || 'Unknown error';
}
