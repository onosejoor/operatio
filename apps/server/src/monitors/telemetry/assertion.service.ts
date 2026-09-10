import { Injectable, Logger } from '@nestjs/common';
import type { AssertionConfig, AssertionResult } from './http-telemetry.types';
import type { HttpTelemetryData } from './http-telemetry.types';
import { AssertionOperator, AssertionType } from '@prisma/client';

@Injectable()
export class AssertionService {
  private readonly logger = new Logger(AssertionService.name);
  private readonly MAX_BODY_SIZE = 10000; // 10KB limit for body processing

  /**
   * Evaluate assertions against HTTP response data.
   * @param assertions - List of assertion configurations
   * @param telemetry - HTTP telemetry data
   * @param responseData - Response body data
   * @param headers - Response headers
   * @returns List of assertion results
   */
  evaluateAssertions(
    assertions: AssertionConfig[],
    telemetry: HttpTelemetryData,
    responseData?: unknown,
    headers?: Record<string, string>,
  ): AssertionResult[] {
    return assertions.map((assertion) =>
      this.evaluateAssertion(assertion, telemetry, responseData, headers),
    );
  }

  private evaluateAssertion(
    assertion: AssertionConfig,
    telemetry: HttpTelemetryData,
    responseData?: unknown,
    headers?: Record<string, string>,
  ): AssertionResult {
    try {
      const baseResult = {
        assertionId: assertion.id,
      };

      switch (assertion.type) {
        case AssertionType.STATUS_CODE:
          return {
            ...baseResult,
            ...this.evaluateStatusCode(assertion, telemetry),
          };
        case AssertionType.RESPONSE_TIME:
          return {
            ...baseResult,
            ...this.evaluateResponseTime(assertion, telemetry),
          };
        case AssertionType.HEADER:
          return {
            ...baseResult,
            ...this.evaluateHeader(assertion, headers),
          };
        case AssertionType.BODY_CONTAINS:
          return {
            ...baseResult,
            ...this.evaluateBodyContains(assertion, responseData),
          };
        default:
          return {
            ...baseResult,
            type: assertion.type,
            passed: false,
            message: `Unknown assertion type: ${assertion.type}`,
          };
      }
    } catch (error) {
      this.logger.error(`Error evaluating assertion: ${error}`);
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed: false,
        message: `Assertion evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private evaluateStatusCode(
    assertion: AssertionConfig,
    telemetry: HttpTelemetryData,
  ): AssertionResult {
    const actual = telemetry.statusCode?.toString() || '0';
    const expected = assertion.expected?.toString() || '200';
    const operator = assertion.operator || AssertionOperator.EQUALS;

    const passed = this.compareValues(
      parseInt(actual),
      parseInt(expected),
      operator,
    );

    return {
      type: AssertionType.STATUS_CODE,
      passed,
      expected: expected,
      actual: actual,
      message: passed
        ? `Status code ${actual} matches ${operator} ${expected}`
        : `Status code ${actual} does not match ${operator} ${expected}`,
    };
  }

  private evaluateResponseTime(
    assertion: AssertionConfig,
    telemetry: HttpTelemetryData,
  ): AssertionResult {
    const actual = telemetry.responseTimeMs;
    const expected = parseInt(assertion.expected?.toString() || '3000');
    const operator = assertion.operator || AssertionOperator.LESS_THAN_OR_EQUAL;

    const passed = this.compareValues(actual, expected, operator);

    return {
      type: AssertionType.RESPONSE_TIME,
      passed,
      expected: expected.toString(),
      actual: actual.toString(),
      message: passed
        ? `Response time ${actual}ms matches ${operator} ${expected}ms`
        : `Response time ${actual}ms does not match ${operator} ${expected}ms`,
    };
  }

  private evaluateHeader(
    assertion: AssertionConfig,
    headers?: Record<string, string>,
  ): AssertionResult {
    if (!assertion.key) {
      return {
        type: AssertionType.HEADER,
        passed: false,
        message: 'Header assertion requires a key',
      };
    }

    const actual = String(headers?.[assertion.key.toLowerCase()] || '');
    const expected = String(assertion.expected || '');
    const operator = assertion.operator || AssertionOperator.EQUALS;

    let passed = false;
    switch (operator) {
      case AssertionOperator.EQUALS:
        passed = actual.toLowerCase() === expected.toLowerCase();
        break;
      case AssertionOperator.NOT_EQUALS:
        passed = actual.toLowerCase() !== expected.toLowerCase();
        break;
      case AssertionOperator.CONTAINS:
        passed = actual.toLowerCase().includes(expected.toLowerCase());
        break;
      default:
        return {
          type: AssertionType.HEADER,
          passed: false,
          expected: expected,
          actual: actual,
          message: `Operator ${operator} is not supported for HEADER assertions`,
        };
    }

    return {
      type: AssertionType.HEADER,
      passed,
      expected: expected,
      actual: actual,
      message: passed
        ? `Header "${assertion.key}" matches ${operator} "${expected}"`
        : `Header "${assertion.key}" does not match ${operator} "${expected}"`,
    };
  }

  private evaluateBodyContains(
    assertion: AssertionConfig,
    responseData?: unknown,
  ): AssertionResult {
    if (!responseData) {
      return {
        type: AssertionType.BODY_CONTAINS,
        passed: false,
        message: 'No response data available',
      };
    }

    const bodyText =
      typeof responseData === 'string'
        ? responseData
        : JSON.stringify(responseData);

    // Check if body exceeds size limit (in bytes, not characters)
    const bodySizeBytes = Buffer.byteLength(bodyText, 'utf8');
    if (bodySizeBytes > this.MAX_BODY_SIZE) {
      this.logger.warn(
        `Response body exceeds ${this.MAX_BODY_SIZE} bytes, skipping BODY_CONTAINS assertion`,
      );
      return {
        type: AssertionType.BODY_CONTAINS,
        passed: false,
        expected: String(assertion.expected || ''),
        actual: `Body too large (${bodySizeBytes} bytes)`,
        message: `Response body exceeds ${this.MAX_BODY_SIZE} bytes limit, cannot evaluate assertion`,
      };
    }

    const expected = String(assertion.expected || '');
    const passed = bodyText.toLowerCase().includes(expected.toLowerCase());

    return {
      type: AssertionType.BODY_CONTAINS,
      passed,
      expected: expected,
      actual: bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : ''),
      message: passed
        ? `Response body contains "${expected}"`
        : `Response body does not contain "${expected}"`,
    };
  }

  private compareValues(
    actual: number,
    expected: number,
    operator: AssertionOperator,
  ): boolean {
    switch (operator) {
      case AssertionOperator.EQUALS:
        return actual === expected;
      case AssertionOperator.NOT_EQUALS:
        return actual !== expected;
      case AssertionOperator.GREATER_THAN:
        return actual > expected;
      case AssertionOperator.LESS_THAN:
        return actual < expected;
      case AssertionOperator.GREATER_THAN_OR_EQUAL:
        return actual >= expected;
      case AssertionOperator.LESS_THAN_OR_EQUAL:
        return actual <= expected;
      default:
        return false;
    }
  }
}
