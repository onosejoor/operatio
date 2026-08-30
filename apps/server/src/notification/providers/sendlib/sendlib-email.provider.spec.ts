import { InternalServerErrorException } from '@nestjs/common';
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
  let provider: SendlibEmailProvider;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    provider = new SendlibEmailProvider(config);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('sends rendered email content through Sendlib', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 202 } as Response);

    await expect(
      provider.send({
        to: 'recipient@example.com',
        subject: 'Verify your email',
        html: '<p>Verify</p>',
      }),
    ).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sendlib.samueltuoyo.com/api/send',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer sendlib-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Operatio <sender@example.com>',
          to: 'recipient@example.com',
          subject: 'Verify your email',
          html: '<p>Verify</p>',
        }),
      }),
    );
  });

  it('rejects failed Sendlib responses', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(
      provider.send({ to: 'recipient@example.com', subject: 'Test', html: '' }),
    ).rejects.toThrow(
      new InternalServerErrorException(
        'Sendlib email delivery failed with status 500',
      ),
    );
  });
});
