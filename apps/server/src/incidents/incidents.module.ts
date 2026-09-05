import { Module } from '@nestjs/common';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { PrismaModule } from '../database/database.module';
import { IncidentConsumer } from './consumers/incident.consumer';

@Module({
  imports: [OutboxModule, PrismaModule],
  providers: [IncidentConsumer],
})
export class IncidentsModule {}
