import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HttpClientService } from '../common/http/http-client.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { MonitorsController } from './monitors.controller';
import { MonitorCheckQueue } from './checker/monitor-check.queue';
import { MonitorCheckService } from './checker/monitor-check.service';
import { MonitorCheckWorker } from './checker/monitor-check.worker';
import { MonitorsService } from './monitors.service';
import { MonitorConsumer } from './consumers/monitor.consumer';

@Module({
  imports: [AuthModule, OrganizationsModule, OutboxModule],
  controllers: [MonitorsController],
  providers: [
    HttpClientService,
    MonitorsService,
    MonitorCheckQueue,
    MonitorCheckService,
    MonitorCheckWorker,
    MonitorConsumer,
  ],
})
export class MonitorsModule { }
