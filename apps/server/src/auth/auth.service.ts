import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { AppConfigService } from '../config/service/app-config.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenPair, TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly appConfig: AppConfigService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const slug = await this.generateSlug(name);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name,
            passwordHash,
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpiresAt,
          },
          select: { name: true, id: true },
        });
        const organization = await tx.organization.create({
          data: { name, slug },
          select: { id: true },
        });
        const membership = await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: MembershipRole.OWNER,
          },
        });

        return { user, organization, membership };
      });

      this.logger.log(`User registered successfully: ${normalizedEmail}`);
      await this.sendVerificationEmail(
        normalizedEmail,
        result.user.name,
        verificationToken,
      );

      return { message: 'User created successfully' };
    } catch (error: unknown) {
      this.logger.error(
        `Registration failed for email: ${normalizedEmail}`,
        error,
      );
      throw error;
    }
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        memberships: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            organization: { select: { name: true, id: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }

  async updateProfile(id: string, name: string) {
    return this.prisma.user.update({
      where: { id },
      data: { name: name.trim() },
      select: { name: true, email: true, emailVerified: true },
    });
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      return {
        message: 'If the account exists, a verification email has been sent',
      };
    }

    const verificationToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.sendVerificationEmail(user.email, user.name, verificationToken);

    return {
      message: 'If the account exists, a verification email has been sent',
    };
  }
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
      select: { id: true, email: true, emailVerificationExpiresAt: true },
    });

    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    const tokens = await this.tokenService.createTokens(user.id);

    return { tokens };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Email address is not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    this.logger.log(`User logged in successfully: ${user.email}`);
    const tokens = await this.tokenService.createTokens(user.id);

    return {
      tokens,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
  }
  refreshTokens(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  private async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<void> {
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Verify your email',
      template: 'email-verification',
      context: {
        name,
        verificationUrl: `${this.appConfig.get('app.frontendUrl')}/verify-email?token=${verificationToken}`,
      },
    });
  }
  private async generateSlug(name: string): Promise<string> {
    const baseSlug =
      name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'organization';
    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
