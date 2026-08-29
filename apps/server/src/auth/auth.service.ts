import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { AppConfigService } from '../config/service/app-config.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MembershipRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly appConfig: AppConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const slug = this.generateSlug(name);

    try {
      // Use MongoDB transaction for atomic operations
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
          data: {
            name,
            slug,
          },
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

      // Send verification email
      await this.notificationService.sendEmail({
        to: normalizedEmail,
        subject: 'Verify your email',
        template: 'email-verification',
        context: {
          name: result.user.name,
          verificationUrl: `${this.appConfig.get('app.frontendUrl')}/verify-email?token=${verificationToken}`,
        },
      });

      return {
        message: 'User Created Successfully',
      };
    } catch (error) {
      this.logger.error(
        `Registration failed for email: ${normalizedEmail}`,
        error,
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user's organization memberships
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: {
        organization: true,
      },
    });

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        organization: {
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
        },
      })),
    };
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36)
    );
  }
}
