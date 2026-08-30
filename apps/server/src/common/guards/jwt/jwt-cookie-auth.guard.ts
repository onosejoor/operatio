import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../../../auth/token.service';
import type { AuthenticatedRequest } from '../../../auth/decorators/current-user.decorator';

@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies.operatio_access_token as
      string | undefined;

    if (!accessToken) {
      throw new UnauthorizedException('Missing access token');
    }

    (request as AuthenticatedRequest).user =
      await this.tokenService.verifyAccessToken(accessToken);

    return true;
  }
}
