import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HttpClientService } from '../common/http/http-client.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { EventDispatcher } from '../infrastructure/outbox/dispatchers/event-dispatcher';
import { EventType } from '../shared/events/event-types';
import { MonitorsController } from './monitors.controller';
import { MonitorCheckQueue } from './checker/monitor-check.queue';
import { MonitorCheckService } from './checker/monitor-check.service';
import { MonitorCheckWorker } from './checker/monitor-check.worker';
import { MonitorsService } from './monitors.service';
import { MonitorCreatedHandler } from './handlers/monitor-created.handler';

@Module({
  imports: [AuthModule, OrganizationsModule, OutboxModule],
  controllers: [MonitorsController],
  providers: [
    HttpClientService,
    MonitorsService,
    MonitorCheckQueue,
    MonitorCheckService,
    MonitorCheckWorker,
    MonitorCreatedHandler,
    {
      provide: 'MONITOR_EVENT_REGISTRATION',
      useFactory: (
        eventDispatcher: EventDispatcher,
        monitorCreatedHandler: MonitorCreatedHandler,
      ) => {
        eventDispatcher.register(
          EventType.MONITOR_CREATED,
          monitorCreatedHandler,
        );
      },
      inject: [EventDispatcher, MonitorCreatedHandler],
    },
  ],
})
export class MonitorsModule { }
