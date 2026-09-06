import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsBoolean, MaxLength } from 'class-validator';

export class CreateStatusPageDto {
  @ApiProperty({ example: 'Acme Status' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the status page is publicly accessible',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({
    example: 'Current operational status of Acme services',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @IsOptional()
  logo?: string;
}
