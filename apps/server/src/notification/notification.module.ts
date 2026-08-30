import { Module } from '@nestjs/common';
import { HttpClientService } from '../common/http/http-client.service';
import { NotificationService } from './notification.service';
import { SendlibEmailProvider } from './providers/sendlib/sendlib-email.provider';

@Module({
  providers: [HttpClientService, NotificationService, SendlibEmailProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
