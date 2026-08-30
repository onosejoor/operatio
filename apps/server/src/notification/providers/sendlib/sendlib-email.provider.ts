import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from 'src/config/service/app-config.service';

export interface SendlibEmail {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class SendlibEmailProvider {
  constructor(private readonly appConfig: AppConfigService) {}

  async send(email: SendlibEmail): Promise<void> {
    const apiKey = this.appConfig.get('sendlib.apiKey');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'SEND_LIB_API_KEY is not configured',
      );
    }

    const response = await fetch('https://sendlib.samueltuoyo.com/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.appConfig.get('sendlib.from'),
        to: email.to,
        subject: email.subject,
        html: email.html,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Sendlib email delivery failed with status ${response.status}`,
      );
    }
  }
}
