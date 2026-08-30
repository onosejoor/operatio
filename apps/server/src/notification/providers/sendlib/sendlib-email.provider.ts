import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpClientService } from '../../../common/http/http-client.service';
import { AppConfigService } from '../../../config/service/app-config.service';

export interface SendlibEmail {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class SendlibEmailProvider {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly httpClient: HttpClientService,
  ) {}

  async send(email: SendlibEmail): Promise<void> {
    const apiKey = this.appConfig.get('sendlib.apiKey');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'SEND_LIB_API_KEY is not configured',
      );
    }

    await this.httpClient.post(
      'https://sendlib.samueltuoyo.com/api/send',
      {
        from: this.appConfig.get('sendlib.from'),
        to: email.to,
        subject: email.subject,
        html: email.html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
