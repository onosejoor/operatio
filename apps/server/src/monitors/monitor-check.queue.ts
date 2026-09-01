import { Injectable } from '@nestjs/common';
import { MONITOR_CHECK_JOB, MONITOR_CHECK_QUEUE } from '../constants';
import { QueuesService } from '../queues/queues.service';
import type { MonitorCheckJobData } from './monitor-check.types';

@Injectable()
export class MonitorCheckQueue {
  constructor(private readonly queuesService: QueuesService) {}

  async enqueue(monitorId: string): Promise<void> {
    await this.queuesService
      .getQueue(MONITOR_CHECK_QUEUE)
      .add(MONITOR_CHECK_JOB, { monitorId } satisfies MonitorCheckJobData);
  }
}
