import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ enum: ['success', 'error'], example: 'success' })
  status: 'success' | 'error';

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false, example: 'EMAIL_NOT_VERIFIED' })
  code?: string;

  constructor(
    status: 'success' | 'error',
    message?: string,
    data?: T,
    code?: string,
  ) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.code = code;
  }

  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto('success', message, data);
  }

  static error(message: string, code?: string): ApiResponseDto {
    return new ApiResponseDto('error', message, undefined, code);
  }
}
