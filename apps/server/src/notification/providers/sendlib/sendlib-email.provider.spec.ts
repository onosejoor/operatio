import { InternalServerErrorException } from '@nestjs/common';
import { HttpClientService } from '../../../common/http/http-client.service';
import { AppConfigService } from '../../../config/service/app-config.service';
import { SendlibEmailProvider } from './sendlib-email.provider';

describe('SendlibEmailProvider', () => {
  const config = {
    get: jest.fn((path: string) => {
      if (path === 'sendlib.apiKey') return 'sendlib-api-key';
      if (path === 'sendlib.from') return 'Operatio <sender@example.com>';
      return undefined;
    }),
  } as unknown as AppConfigService;
  const httpClient = {
    post: jest.fn(),
  } as unknown as HttpClientService;
  let provider: SendlibEmailProvider;

  beforeEach(() => {
    provider = new SendlibEmailProvider(config, httpClient);
    jest.clearAllMocks();
  });

  it('sends rendered email content through Sendlib', async () => {
    jest.spyOn(httpClient, 'post').mockResolvedValue(undefined);

    await expect(
      provider.send({
        to: 'recipient@example.com',
        subject: 'Verify your email',
        html: '<p>Verify</p>',
      }),
    ).resolves.toBeUndefined();

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://sendlib.samueltuoyo.com/api/send',
      {
        from: 'Operatio <sender@example.com>',
        to: 'recipient@example.com',
        subject: 'Verify your email',
        html: '<p>Verify</p>',
      },
      {
        headers: {
          Authorization: 'Bearer sendlib-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('rejects sending when no Sendlib API key is configured', async () => {
    jest.spyOn(config, 'get').mockReturnValueOnce('');

    await expect(
      provider.send({ to: 'recipient@example.com', subject: 'Test', html: '' }),
    ).rejects.toThrow(
      new InternalServerErrorException('SEND_LIB_API_KEY is not configured'),
    );
  });
});
