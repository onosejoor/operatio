import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/service/app-config.service';

interface EmailJob {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private appConfig: AppConfigService) {}

  async sendEmail(job: EmailJob) {
    this.logger.log(
      `Sending email to ${job.to} with template: ${job.template}`,
    );

    // Render template with context
    const html = this.renderTemplate(job.template, job.context);

    // TODO: Implement actual email sending with nodemailer
    // For now, just log the email content
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

  private renderTemplate(
    template: string,
    context: Record<string, any>,
  ): string {
    let rendered = template;

    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }
}
