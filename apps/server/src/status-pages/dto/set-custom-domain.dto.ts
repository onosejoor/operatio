import { ApiProperty } from '@nestjs/swagger';
import { IsFQDN, IsString } from 'class-validator';

export class SetCustomDomainDto {
  @ApiProperty({
    example: 'status.acme.com',
    description: 'The fully qualified custom domain to connect to this status page',
  })
  @IsString()
  @IsFQDN()
  domain!: string;
}
