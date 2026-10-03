import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMaintenanceWindowDto {
  @ApiProperty({ example: 'Database upgrade' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'We will upgrade the primary database cluster.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2026-10-04T01:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-10-04T02:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ example: '66f123456789012345678901' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  statusPageId!: string;
}

export class UpdateMaintenanceWindowDto extends PartialType(CreateMaintenanceWindowDto) {}
