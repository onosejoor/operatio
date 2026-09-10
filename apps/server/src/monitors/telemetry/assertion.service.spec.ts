import { Test, TestingModule } from '@nestjs/testing';
import { AssertionService } from './assertion.service';
import type { AssertionConfig, AssertionResult } from './http-telemetry.types';
import type { HttpTelemetryData } from './http-telemetry.types';
import { AssertionOperator } from '@prisma/client';

describe('AssertionService', () => {
  let service: AssertionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssertionService],
    }).compile();

    service = module.get<AssertionService>(AssertionService);
  });

  describe('evaluateAssertions', () => {
    it('should evaluate multiple assertions', () => {
      const assertions: AssertionConfig[] = [
        {
          type: 'STATUS_CODE',
          expected: '200',
          operator: AssertionOperator.EQUALS,
        },
        {
          type: 'RESPONSE_TIME',
          expected: '1000',
          operator: AssertionOperator.LESS_THAN_OR_EQUAL,
        },
      ];

      const telemetry: HttpTelemetryData = {
        statusCode: 200,
        responseTimeMs: 500,
      };

      const results = service.evaluateAssertions(assertions, telemetry);

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
    });

    it('should handle empty assertions array', () => {
      const results = service.evaluateAssertions([], { responseTimeMs: 0 });
      expect(results).toEqual([]);
    });

    it('should include assertion ID in results', () => {
      const assertions: AssertionConfig[] = [
        {
          type: 'STATUS_CODE',
          expected: '200',
          operator: AssertionOperator.EQUALS,
          id: 'assertion-123',
        },
      ];

      const telemetry: HttpTelemetryData = {
        statusCode: 200,
        responseTimeMs: 100,
      };

      const results = service.evaluateAssertions(assertions, telemetry);

      expect(results).toHaveLength(1);
      expect(results[0].assertionId).toBe('assertion-123');
    });
  });

  describe('STATUS_CODE assertions', () => {
    it('should pass when status code matches', () => {
      const assertion: AssertionConfig = {
        type: 'STATUS_CODE',
        expected: '200',
        operator: AssertionOperator.EQUALS,
      };

      const telemetry: HttpTelemetryData = {
        statusCode: 200,
        responseTimeMs: 100,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
      expect(result.type).toBe('STATUS_CODE');
      expect(result.actual).toBe('200');
    });

    it('should fail when status code does not match', () => {
      const assertion: AssertionConfig = {
        type: 'STATUS_CODE',
        expected: '200',
        operator: AssertionOperator.EQUALS,
      };

      const telemetry: HttpTelemetryData = {
        statusCode: 404,
        responseTimeMs: 100,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(false);
    });

    it('should support greater than operator', () => {
      const assertion: AssertionConfig = {
        type: 'STATUS_CODE',
        expected: '399',
        operator: AssertionOperator.GREATER_THAN,
      };

      const telemetry: HttpTelemetryData = {
        statusCode: 400,
        responseTimeMs: 100,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });

    it('should support less than or equal operator', () => {
      const assertion: AssertionConfig = {
        type: 'STATUS_CODE',
        expected: '400',
        operator: AssertionOperator.LESS_THAN_OR_EQUAL,
      };

      const telemetry: HttpTelemetryData = {
        statusCode: 400,
        responseTimeMs: 100,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });

    it('should support not equals operator', () => {
      const assertion: AssertionConfig = {
        type: 'STATUS_CODE',
        expected: '500',
        operator: AssertionOperator.NOT_EQUALS,
      };

      const telemetry: HttpTelemetryData = {
        statusCode: 200,
        responseTimeMs: 100,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });
  });

  describe('RESPONSE_TIME assertions', () => {
    it('should pass when response time is within threshold', () => {
      const assertion: AssertionConfig = {
        type: 'RESPONSE_TIME',
        expected: '1000',
        operator: AssertionOperator.LESS_THAN_OR_EQUAL,
      };

      const telemetry: HttpTelemetryData = {
        responseTimeMs: 500,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });

    it('should fail when response time exceeds threshold', () => {
      const assertion: AssertionConfig = {
        type: 'RESPONSE_TIME',
        expected: '1000',
        operator: AssertionOperator.LESS_THAN_OR_EQUAL,
      };

      const telemetry: HttpTelemetryData = {
        responseTimeMs: 1500,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(false);
    });

    it('should support greater than operator', () => {
      const assertion: AssertionConfig = {
        type: 'RESPONSE_TIME',
        expected: '1000',
        operator: AssertionOperator.GREATER_THAN,
      };

      const telemetry: HttpTelemetryData = {
        responseTimeMs: 1500,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });

    it('should support equals operator', () => {
      const assertion: AssertionConfig = {
        type: 'RESPONSE_TIME',
        expected: '1000',
        operator: AssertionOperator.EQUALS,
      };

      const telemetry: HttpTelemetryData = {
        responseTimeMs: 1000,
      };

      const result = service.evaluateAssertions([assertion], telemetry)[0];

      expect(result.passed).toBe(true);
    });
  });

  describe('HEADER assertions', () => {
    it('should pass when header matches', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'content-type',
        expected: 'application/json',
        operator: AssertionOperator.EQUALS,
      };

      const headers = {
        'content-type': 'application/json',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        headers,
      )[0];

      expect(result.passed).toBe(true);
    });

    it('should support contains operator for headers', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'content-type',
        expected: 'json',
        operator: AssertionOperator.CONTAINS,
      };

      const headers = {
        'content-type': 'application/json',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        headers,
      )[0];

      expect(result.passed).toBe(true);
    });

    it('should support not equals operator for headers', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'content-type',
        expected: 'text/html',
        operator: AssertionOperator.NOT_EQUALS,
      };

      const headers = {
        'content-type': 'application/json',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        headers,
      )[0];

      expect(result.passed).toBe(true);
    });

    it('should fail when header equals with not equals operator', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'content-type',
        expected: 'application/json',
        operator: AssertionOperator.NOT_EQUALS,
      };

      const headers = {
        'content-type': 'application/json',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        headers,
      )[0];

      expect(result.passed).toBe(false);
    });

    it('should fail when header key is missing', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'x-custom-header',
        expected: 'value',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        {},
      )[0];

      expect(result.passed).toBe(false);
    });

    it('should fail when assertion has no key', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        expected: 'value',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        {},
      )[0];

      expect(result.passed).toBe(false);
      expect(result.message).toContain('requires a key');
    });

    it('should reject unsupported operators for headers', () => {
      const assertion: AssertionConfig = {
        type: 'HEADER',
        key: 'content-type',
        expected: 'application/json',
        operator: AssertionOperator.GREATER_THAN,
      };

      const headers = {
        'content-type': 'application/json',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
        headers,
      )[0];

      expect(result.passed).toBe(false);
      expect(result.message).toContain('not supported for HEADER assertions');
    });
  });

  describe('BODY_CONTAINS assertions', () => {
    it('should pass when body contains expected text', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'success',
      };

      const responseData = { status: 'success' };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        responseData,
      )[0];

      expect(result.passed).toBe(true);
    });

    it('should fail when body does not contain expected text', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'error',
      };

      const responseData = { status: 'success' };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        responseData,
      )[0];

      expect(result.passed).toBe(false);
    });

    it('should handle string response data', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'hello',
      };

      const responseData = 'hello world';

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        responseData,
      )[0];

      expect(result.passed).toBe(true);
    });

    it('should fail when no response data is available', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'test',
      };

      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        undefined,
      )[0];

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No response data');
    });

    it('should fail when response body exceeds size limit', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'test',
      };

      // Create a response body larger than the 10KB limit (in bytes)
      const largeBody = 'x'.repeat(10001);
      expect(Buffer.byteLength(largeBody, 'utf8')).toBeGreaterThan(10000);
      
      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        largeBody,
      )[0];

      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceeds');
      expect(result.message).toContain('limit');
    });

    it('should pass when response body is within size limit', () => {
      const assertion: AssertionConfig = {
        type: 'BODY_CONTAINS',
        expected: 'test',
      };

      // Create a response body within the 10KB limit (in bytes)
      const body = 'x'.repeat(9995) + 'test';
      expect(Buffer.byteLength(body, 'utf8')).toBeLessThanOrEqual(10000);
      
      const result = service.evaluateAssertions(
        [assertion],
        { responseTimeMs: 0 },
        body,
      )[0];

      expect(result.passed).toBe(true);
    });
  });
});
