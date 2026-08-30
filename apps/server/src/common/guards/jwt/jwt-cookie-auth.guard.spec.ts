jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtCookieAuthGuard } from './jwt-cookie-auth.guard';
import { TokenService } from '../../../auth/token.service';

describe('JwtCookieAuthGuard', () => {
  const tokenService = {
    verifyAccessToken: jest.fn(),
  } as unknown as TokenService;
  const guard = new JwtCookieAuthGuard(tokenService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reads the access token from cookie-parser and attaches the user', async () => {
    const request = {
      cookies: { operatio_access_token: 'access-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    jest
      .spyOn(tokenService, 'verifyAccessToken')
      .mockResolvedValue({ id: 'user-id' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('access-token');
    expect(request).toMatchObject({
      user: { id: 'user-id' },
    });
  });

  it('rejects requests without an access-token cookie', async () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ cookies: {} }) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Missing access token'),
    );
  });
});
