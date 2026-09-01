import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../database/database.module';
import { OutboxWriter } from './writers/outbox.writer';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxDispatcher } from './dispatchers/outbox.dispatcher';
import { EventDispatcher } from './dispatchers/event-dispatcher';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [
    OutboxWriter,
    OutboxRepository,
    OutboxDispatcher,
    EventDispatcher,
  ],
  exports: [OutboxWriter, EventDispatcher],
})
export class OutboxModule {}
