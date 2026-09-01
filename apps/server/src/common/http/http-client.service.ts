import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

export interface HttpResponse<T> {
  data: T;
  status: number;
}

@Injectable()
export class HttpClientService {
  private logger = new Logger(HttpClientService.name)
  private readonly client = axios.create();

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, {
      ...config,
      validateStatus: () => true,
    });

    return { data: response.data, status: response.status };
  }

  async post<TResponse, TBody>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, body, config);

    return response.data;
  }
}
