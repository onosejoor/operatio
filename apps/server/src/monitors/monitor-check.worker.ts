import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { MONITOR_CHECK_QUEUE } from '../constants';
import { QueuesService } from '../queues/queues.service';
import { MonitorCheckService } from './monitor-check.service';
import type { MonitorCheckJobData } from './monitor-check.types';

@Injectable()
export class MonitorCheckWorker implements OnModuleInit {
  constructor(
    private readonly queuesService: QueuesService,
    private readonly monitorCheckService: MonitorCheckService,
  ) {}

  onModuleInit(): void {
    this.queuesService.createWorker(
      MONITOR_CHECK_QUEUE,
      async (job: Job<MonitorCheckJobData>) => {
        await this.monitorCheckService.execute(job.data.monitorId);
      },
    );
  }
}
