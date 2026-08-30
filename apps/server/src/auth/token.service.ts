import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database/database.service';
import { AppConfigService } from '../config/service/app-config.service';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  tokenId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createTokens(userId: string, email: string): Promise<TokenPair> {
    const accessExpiresIn = this.parseTokenLifetime(
      this.appConfig.get('jwt.accessTokenExpiresIn'),
    );
    const refreshExpiresIn = this.parseTokenLifetime(
      this.appConfig.get('jwt.refreshTokenExpiresIn'),
    );
    const token = await this.prisma.token.create({
      data: {
        userId,
        tokenHash: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
      },
    });
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, type: 'access' },
      { expiresIn: accessExpiresIn },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, type: 'refresh', tokenId: token.id },
      { expiresIn: refreshExpiresIn },
    );

    await this.prisma.token.update({
      where: { id: token.id },
      data: { tokenHash: this.hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return { id: payload.sub };
  }

  async rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const token = await this.prisma.token.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (
      !token ||
      token.revokedAt ||
      token.expiresAt <= new Date() ||
      token.tokenHash !== this.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.token.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    return this.createTokens(token.user.id, token.user.email);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prisma.token.updateMany({
        where: {
          id: payload.tokenId,
          tokenHash: this.hashToken(refreshToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } catch {
      return;
    }
  }

  getAccessTokenMaxAge(): number {
    return (
      this.parseTokenLifetime(this.appConfig.get('jwt.accessTokenExpiresIn')) *
      1000
    );
  }

  getRefreshTokenMaxAge(): number {
    return (
      this.parseTokenLifetime(this.appConfig.get('jwt.refreshTokenExpiresIn')) *
      1000
    );
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<TokenPayload & { tokenId: string }> {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || !payload.tokenId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return { ...payload, tokenId: payload.tokenId };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTokenLifetime(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);

    if (!match) {
      throw new Error(`Invalid JWT lifetime: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };

    return amount * multipliers[unit];
  }
}
