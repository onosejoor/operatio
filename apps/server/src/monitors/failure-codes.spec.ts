import { normalizeHttpError, getFailureDescription } from './failure-codes';

describe('FailureCodes', () => {
  describe('normalizeHttpError', () => {
    it('should normalize timeout errors', () => {
      const timeoutError = new Error('Request timed out');
      (timeoutError as any).code = 'ETIMEDOUT';
      expect(normalizeHttpError(timeoutError)).toBe('TIMEOUT');

      const socketTimeoutError = new Error('Socket timeout');
      (socketTimeoutError as any).code = 'ESOCKETTIMEDOUT';
      expect(normalizeHttpError(socketTimeoutError)).toBe('TIMEOUT');

      const timeoutMessageError = new Error('Connection timeout after 10000ms');
      expect(normalizeHttpError(timeoutMessageError)).toBe('TIMEOUT');
    });

    it('should normalize DNS errors', () => {
      const notFoundError = new Error('getaddrinfo ENOTFOUND');
      (notFoundError as any).code = 'ENOTFOUND';
      expect(normalizeHttpError(notFoundError)).toBe('DNS_ERROR');

      const noDataError = new Error('ENODATA');
      (noDataError as any).code = 'ENODATA';
      expect(normalizeHttpError(noDataError)).toBe('DNS_ERROR');

      const dnsMessageError = new Error('DNS lookup failed');
      expect(normalizeHttpError(dnsMessageError)).toBe('DNS_ERROR');
    });

    it('should normalize connection refused errors', () => {
      const connRefusedError = new Error('ECONNREFUSED');
      (connRefusedError as any).code = 'ECONNREFUSED';
      expect(normalizeHttpError(connRefusedError)).toBe('CONNECTION_REFUSED');

      const connRefusedMessageError = new Error('Connection refused');
      expect(normalizeHttpError(connRefusedMessageError)).toBe(
        'CONNECTION_REFUSED',
      );
    });

    it('should normalize connection reset errors', () => {
      const connResetError = new Error('ECONNRESET');
      (connResetError as any).code = 'ECONNRESET';
      expect(normalizeHttpError(connResetError)).toBe('CONNECTION_RESET');

      const pipeError = new Error('EPIPE');
      (pipeError as any).code = 'EPIPE';
      expect(normalizeHttpError(pipeError)).toBe('CONNECTION_RESET');

      const resetMessageError = new Error('Connection reset by peer');
      expect(normalizeHttpError(resetMessageError)).toBe('CONNECTION_RESET');
    });

    it('should normalize TLS errors', () => {
      const tlsError = new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
      (tlsError as any).code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
      expect(normalizeHttpError(tlsError)).toBe('TLS_ERROR');

      const certExpiredError = new Error('CERT_HAS_EXPIRED');
      (certExpiredError as any).code = 'CERT_HAS_EXPIRED';
      expect(normalizeHttpError(certExpiredError)).toBe('TLS_ERROR');

      const protoError = new Error('EPROTO');
      (protoError as any).code = 'EPROTO';
      expect(normalizeHttpError(protoError)).toBe('TLS_ERROR');

      const tlsMessageError = new Error('TLS handshake failed');
      expect(normalizeHttpError(tlsMessageError)).toBe('TLS_ERROR');

      const sslMessageError = new Error('SSL certificate error');
      expect(normalizeHttpError(sslMessageError)).toBe('TLS_ERROR');
    });

    it('should normalize network errors', () => {
      const netUnreachError = new Error('ENETUNREACH');
      (netUnreachError as any).code = 'ENETUNREACH';
      expect(normalizeHttpError(netUnreachError)).toBe('NETWORK_ERROR');

      const hostUnreachError = new Error('EHOSTUNREACH');
      (hostUnreachError as any).code = 'EHOSTUNREACH';
      expect(normalizeHttpError(hostUnreachError)).toBe('NETWORK_ERROR');

      const networkMessageError = new Error('Network unreachable');
      expect(normalizeHttpError(networkMessageError)).toBe('NETWORK_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized errors', () => {
      const unknownError = new Error('Some unknown error');
      expect(normalizeHttpError(unknownError)).toBe('UNKNOWN_ERROR');

      expect(normalizeHttpError(null)).toBe('UNKNOWN_ERROR');
      expect(normalizeHttpError(undefined)).toBe('UNKNOWN_ERROR');
      expect(normalizeHttpError('string error')).toBe('UNKNOWN_ERROR');
    });

    it('should handle Axios error objects', () => {
      const axiosError = {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      };
      expect(normalizeHttpError(axiosError)).toBe('TIMEOUT');
    });
  });

  describe('getFailureDescription', () => {
    it('should return human-readable descriptions', () => {
      expect(getFailureDescription('HTTP_ERROR')).toBe('HTTP error response');
      expect(getFailureDescription('TIMEOUT')).toBe('Request timed out');
      expect(getFailureDescription('DNS_ERROR')).toBe('DNS resolution failed');
      expect(getFailureDescription('CONNECTION_REFUSED')).toBe(
        'Connection refused',
      );
      expect(getFailureDescription('CONNECTION_RESET')).toBe(
        'Connection reset',
      );
      expect(getFailureDescription('TLS_ERROR')).toBe('TLS/SSL error');
      expect(getFailureDescription('NETWORK_ERROR')).toBe('Network error');
      expect(getFailureDescription('ASSERTION_FAILED')).toBe(
        'Assertion failed',
      );
      expect(getFailureDescription('UNKNOWN_ERROR')).toBe('Unknown error');
    });
  });
});
