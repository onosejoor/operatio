import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { HttpTelemetryData } from '../../monitors/telemetry/http-telemetry.types';

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string | string[] | undefined>;
  telemetry: HttpTelemetryData;
}

@Injectable()
export class HttpClientService {
  private logger = new Logger(HttpClientService.name);
  private readonly client = axios.create();

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<HttpResponse<T>> {
    const startedAt = performance.now();

    const response = await this.client.get<T>(url, {
      ...config,
      validateStatus: () => true,
      maxRedirects: 5,
    });

    const responseTimeMs = Math.round(performance.now() - startedAt);

    const telemetry: HttpTelemetryData = {
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs,
      protocol: this.extractProtocol(response),
      redirected: response.request?.res?.responseUrl !== url,
      // Intentionally omit redirectCount: we cannot measure it with axios
      // (see HttpTelemetryData.redirectCount TODO). Leaving it undefined
      // avoids emitting a misleading "0" that would look like a known count.
      finalUrl: response.request?.res?.responseUrl || url,
      responseSizeBytesEstimated: this.estimateResponsePayloadBytes(response),
    };

    return {
      data: response.data,
      status: response.status,
      headers: response.headers as HttpResponse<T>['headers'],
      telemetry,
    };
  }

  async post<TResponse, TBody>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, body, config);

    return response.data;
  }

  private extractProtocol(response: AxiosResponse): string | undefined {
    const httpVersion = response.request?.res?.httpVersion;
    if (httpVersion) {
      return httpVersion.startsWith('HTTP/')
        ? httpVersion
        : `HTTP/${httpVersion}`;
    }
    return undefined;
  }

  /**
   * Returns the *estimated* response payload size in bytes.
   *
   * Exact (and preferred) when the server sends a `content-length` header.
   * When absent, falls back to `Buffer.byteLength(JSON.stringify(response.data))`
   * which is a rough estimate of the decoded/parsed body size — it does NOT
   * reflect actual wire bytes (ignores gzip, chunked framing, headers, etc.).
   * Do not present to users as "network response size"; the corresponding
   * field is named `responseSizeBytesEstimated` to make this explicit.
   */
  private estimateResponsePayloadBytes(
    response: AxiosResponse,
  ): number | undefined {
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      const parsed = parseInt(String(contentLength), 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    if (response.data == null) return undefined;

    try {
      const jsonString =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch {
      return undefined;
    }
  }
}
