import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RATE_LIMITS } from './constants';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([RATE_LIMITS.default]),
    PrismaModule,
    RedisModule,
    QueuesModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
