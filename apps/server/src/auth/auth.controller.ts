import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { TokenPair, TokenService } from './token.service';
import { AppConfigService } from '../config/service/app-config.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Post('register')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
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

  @Post('login')
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
  @ApiResponse({
    status: 400,
    description: 'Validation error',
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
    const refreshToken = this.getCookie(
      request.headers.cookie,
      'operatio_refresh_token',
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(response, tokens);

    return ApiResponseDto.success(undefined, 'Tokens refreshed successfully');
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
      path: '/api/v1/auth/refresh',
    });
  }

  private getCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | undefined {
    return cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim().split('='))
      .find(([key]) => key === name)
      ?.slice(1)
      .join('=');
  }
}
