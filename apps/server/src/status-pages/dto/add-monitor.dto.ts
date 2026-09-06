import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class AddMonitorToStatusPageDto {
  @ApiProperty({ example: 'monitor-id-123' })
  @IsString()
  monitorId!: string;

  @ApiProperty({ example: 0, description: 'Display order on the status page' })
  @IsInt()
  @Min(0)
  order!: number;
}
