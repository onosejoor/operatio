import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuesService.name);
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();

  constructor(private redisService: RedisService) {}

  async onModuleInit() {
    this.logger.log('BullMQ queues initialized');
  }

  async onModuleDestroy() {
    this.logger.log('Closing BullMQ queues and workers');
    
    // Close all workers
    for (const [name, worker] of this.workers) {
      try {
        await worker.close();
        this.logger.log(`Worker for queue '${name}' closed`);
      } catch (error) {
        this.logger.error(`Error closing worker for queue '${name}'`, error);
      }
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        this.logger.log(`Queue '${name}' closed`);
      } catch (error) {
        this.logger.error(`Error closing queue '${name}'`, error);
      }
    }

    this.workers.clear();
    this.queues.clear();
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const connection = this.redisService.getClient();
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          removeOnComplete: {
            count: 1000,
            age: 3600, // 1 hour
          },
          removeOnFail: {
            count: 5000,
          },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.queues.set(name, queue);
      this.logger.log(`Queue '${name}' created`);
    }

    return this.queues.get(name)!;
  }

  createWorker(
    name: string,
    processor: (job: any) => Promise<any>,
    options?: any,
  ): Worker {
    if (this.workers.has(name)) {
      this.logger.warn(`Worker for queue '${name}' already exists`);
      return this.workers.get(name)!;
    }

    const connection = this.redisService.getClient();
    const worker = new Worker(name, processor, {
      connection,
      concurrency: options?.concurrency || 5,
      ...options,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} in queue '${name}' completed`);
    });

    worker.on('failed', (job, error) => {
      this.logger.error(
        `Job ${job?.id} in queue '${name}' failed`,
        error,
      );
    });

    this.workers.set(name, worker);
    this.logger.log(`Worker for queue '${name}' created`);

    return worker;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check if Redis is available (queues depend on Redis)
      return await this.redisService.healthCheck();
    } catch (error) {
      this.logger.error('BullMQ health check failed', error);
      return false;
    }
  }
}
