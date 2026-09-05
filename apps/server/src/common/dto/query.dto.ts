import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class QueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Filter records from this date onwards (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filter records up to this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
