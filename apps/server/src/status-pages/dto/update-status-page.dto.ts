import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateStatusPageDto } from './create-status-page.dto';

export class UpdateStatusPageDto extends PartialType(CreateStatusPageDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the status page is publicly accessible',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
