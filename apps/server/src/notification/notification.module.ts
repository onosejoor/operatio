import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendlibEmailProvider } from './providers/sendlib/sendlib-email.provider';

@Module({
  providers: [NotificationService, SendlibEmailProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
