import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpClientService {
  private readonly client = axios.create();

  async post<TResponse, TBody>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, body, config);

    return response.data;
  }
}
