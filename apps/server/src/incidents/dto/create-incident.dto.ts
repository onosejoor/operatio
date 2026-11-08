import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({ description: 'Title or summary of the incident' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed update message or notes' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({
    enum: IncidentSeverity,
    default: IncidentSeverity.MINOR,
    description: 'Severity level of the incident',
  })
  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity = IncidentSeverity.MINOR;

  @ApiPropertyOptional({
    enum: IncidentStatus,
    default: IncidentStatus.INVESTIGATING,
    description: 'Current lifecycle status of the incident',
  })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus = IncidentStatus.INVESTIGATING;

  @ApiPropertyOptional({
    description: 'Optional ID of the monitor or service experiencing the issue',
  })
  @IsString()
  @IsOptional()
  monitorId?: string;

  @ApiPropertyOptional({
    description:
      'Whether this is an internal issue (hidden from public status pages)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean = false;
}
