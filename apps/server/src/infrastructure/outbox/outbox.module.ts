import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../database/database.module';
import { OutboxWriter } from './writers/outbox.writer';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxDispatcher } from './dispatchers/outbox.dispatcher';
import { EventDispatcher } from './dispatchers/event-dispatcher';
import { EventHandlerRegistrar } from '../../shared/events/event-handler-registrar';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), DiscoveryModule],
  providers: [
    OutboxWriter,
    OutboxRepository,
    OutboxDispatcher,
    EventDispatcher,
    EventHandlerRegistrar,
  ],
  exports: [OutboxWriter, EventDispatcher, OutboxRepository],
})
export class OutboxModule {}
