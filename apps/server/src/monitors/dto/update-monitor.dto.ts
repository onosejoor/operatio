import { PartialType } from '@nestjs/swagger';
import { CreateMonitorDto } from './create-monitor.dto';

export class UpdateMonitorDto extends PartialType(CreateMonitorDto) {}
