import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMonitorDto } from './create-monitor.dto';

export class UpdateMonitorDto extends PartialType(CreateMonitorDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether Upwatch should actively check this monitor.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the monitor is eligible to appear on a public status page',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
