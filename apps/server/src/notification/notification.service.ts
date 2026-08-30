import { Injectable, Logger } from '@nestjs/common';
import {
  EMAIL_TEMPLATES,
  EmailTemplateContextMap,
  EmailTemplateName,
} from './email-templates.constants';
import { SendlibEmailProvider } from './providers/sendlib/sendlib-email.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly emailProvider: SendlibEmailProvider) {}

  async sendEmail<T extends EmailTemplateName>(job: {
    to: string;
    subject: string;
    template: T;
    context: EmailTemplateContextMap[T];
  }): Promise<void> {
    const html = EMAIL_TEMPLATES[job.template](job.context);

    await this.emailProvider.send({
      to: job.to,
      subject: job.subject,
      html,
    });
    this.logger.log(`Email sent with template: ${job.template}`);
  }
}
