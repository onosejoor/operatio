import { Module, Global } from '@nestjs/common';
import { QueuesService } from './queues.service';

@Global()
@Module({
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
