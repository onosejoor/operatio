import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = { method: 'GET', url: '/api/v1/auth/me' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  const filter = new HttpExceptionFilter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats HTTP exceptions with ApiResponseDto', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    filter.catch(
      new HttpException('Missing access token', HttpStatus.UNAUTHORIZED),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing access token',
      data: undefined,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'GET /api/v1/auth/me 401 - Missing access token',
    );
    warnSpy.mockRestore();
  });

  it('does not expose unexpected error messages', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(new Error('database details'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
      data: undefined,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
