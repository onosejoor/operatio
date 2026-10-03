import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { MonitorStatus } from '@prisma/client';
import { QueryDto } from '../../common/dto/query.dto';

export class MonitorChecksQueryDto extends PartialType(QueryDto) {
  @ApiPropertyOptional({ enum: MonitorStatus })
  @IsOptional()
  @IsEnum(MonitorStatus)
  status?: MonitorStatus;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'slowest'] })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'slowest'])
  sort?: 'newest' | 'oldest' | 'slowest';
}
