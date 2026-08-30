import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../constants';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { TokenPair, TokenService } from './token.service';
import { AppConfigService } from '../config/service/app-config.service';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: RATE_LIMITS.auth.register })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ApiResponseDto,
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ApiResponseDto.success(
      result,
      'Registration successful. Please check your email to verify your account.',
    );
  }

  @Post('verify-email')
  @Throttle({ default: RATE_LIMITS.auth.verifyEmail })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address and start a session' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ApiResponseDto,
  })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { tokens } = await this.authService.verifyEmail(verifyEmailDto.token);
    this.setAuthCookies(response, tokens);

    return ApiResponseDto.success(undefined, 'Email verified successfully');
  }

  @Post('resend-verification')
  @Throttle({ default: RATE_LIMITS.auth.resendVerification })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend an email verification link' })
  @ApiResponse({
    status: 200,
    description: 'Verification email processing completed',
    type: ApiResponseDto,
  })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    const result = await this.authService.resendVerification(
      resendVerificationDto.email,
    );
    return ApiResponseDto.success(result, result.message);
  }

  @Post('login')
  @Throttle({ default: RATE_LIMITS.auth.login })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ApiResponseDto,
  })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { tokens, ...result } = await this.authService.login(loginDto);
    this.setAuthCookies(response, tokens);

    return ApiResponseDto.success(result, 'Login successful');
  }

  @Post('refresh')
  @Throttle({ default: RATE_LIMITS.auth.refresh })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ApiResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.operatio_refresh_token as
      string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(response, tokens);

    return ApiResponseDto.success(undefined, 'Tokens refreshed successfully');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End the current session' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: ApiResponseDto,
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      request.cookies.operatio_refresh_token as string | undefined,
    );
    this.clearAuthCookies(response);

    return ApiResponseDto.success(undefined, 'Logout successful');
  }

  @Get('me')
  @UseGuards(JwtCookieAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user identity' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token',
    type: ApiResponseDto,
  })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const userData = await this.authService.getUser(user.id);
    return ApiResponseDto.success(userData);
  }

  private setAuthCookies(response: Response, tokens: TokenPair): void {
    const secure = this.appConfig.get('app.nodeEnv') === 'production';

    response.cookie('operatio_access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: this.tokenService.getAccessTokenMaxAge(),
      path: '/',
    });
    response.cookie('operatio_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: this.tokenService.getRefreshTokenMaxAge(),
      path: '/api/v1/auth',
    });
  }

  private clearAuthCookies(response: Response): void {
    const secure = this.appConfig.get('app.nodeEnv') === 'production';

    response.clearCookie('operatio_access_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
    response.clearCookie('operatio_refresh_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }
}
