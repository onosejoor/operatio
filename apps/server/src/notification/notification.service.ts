import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/service/app-config.service';
import {
  EMAIL_TEMPLATES,
  EmailTemplateContextMap,
  EmailTemplateName,
} from './email-templates.constants';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private appConfig: AppConfigService) {}

  async sendEmail<T extends EmailTemplateName>(job: {
    to: string;
    subject: string;
    template: T;
    context: EmailTemplateContextMap[T];
  }) {
    this.logger.log(
      `Sending email to ${job.to} with template: ${job.template}`,
    );

    const renderTemplate = EMAIL_TEMPLATES[job.template];
    const html = renderTemplate(job.context);

    this.logger.log(`Email subject: ${job.subject}`);
    this.logger.log(`Email content: ${html}`);

    // Example implementation (when nodemailer is added):
    // const transporter = nodemailer.createTransport({
    //   host: this.appConfig.get('email.host'),
    //   port: this.appConfig.get('email.port'),
    //   auth: {
    //     user: this.appConfig.get('email.user'),
    //     pass: this.appConfig.get('email.password'),
    //   },
    // });

    // await transporter.sendMail({
    //   from: this.appConfig.get('email.from'),
    //   to: job.to,
    //   subject: job.subject,
    //   html,
    // });
  }
}
