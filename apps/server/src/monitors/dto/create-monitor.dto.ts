import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMonitorDto {
  @ApiProperty({ example: 'Production API' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'https://api.example.com/health' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;

  @ApiProperty({
    example: 60,
    minimum: 30,
    maximum: 3600,
    description: 'How often Upwatch checks the URL, in seconds.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(3600)
  interval: number = 60;

  @ApiProperty({
    example: 10_000,
    minimum: 1000,
    maximum: 60_000,
    description: 'Maximum duration for a check, in milliseconds.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(60_000)
  timeout: number = 10_000;
}
