import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ enum: ['success', 'error'], example: 'success' })
  status: 'success' | 'error';

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  data?: T;

  constructor(status: 'success' | 'error', message?: string, data?: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto('success', message, data);
  }

  static error(
    message: string,
    errors?: Record<string, string[]>,
  ): ApiResponseDto {
    return new ApiResponseDto('error', message, undefined);
  }
}
