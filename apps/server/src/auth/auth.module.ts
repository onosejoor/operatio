import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { JwtCookieAuthGuard } from '../common/guards/jwt/jwt-cookie-auth.guard';
import { NotificationModule } from '../notification/notification.module';
import { ConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/service/app-config.service';

@Module({
  imports: [
    NotificationModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.get('jwt.secret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtCookieAuthGuard],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
