import { Module } from '@nestjs/common';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { PrismaModule } from '../database/database.module';
import { IncidentConsumer } from './consumers/incident.consumer';
import { IncidentsService } from './incidents.service';
import {
  IncidentsController,
  OrganizationIncidentsController,
} from './incidents.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [OutboxModule, PrismaModule, AuthModule],
  providers: [IncidentConsumer, IncidentsService],
  controllers: [IncidentsController, OrganizationIncidentsController],
})
export class IncidentsModule {}
