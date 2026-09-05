import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { RATE_LIMITS } from './constants';
import { PrismaModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MonitorsModule } from './monitors/monitors.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { OutboxModule } from './infrastructure/outbox/outbox.module';
import { QueuesModule } from './queues/queues.module';
import { RedisModule } from './redis/redis.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([RATE_LIMITS.default]),
    PrismaModule,
    RedisModule,
    QueuesModule,
    OutboxModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    MonitorsModule,
    IncidentsModule,
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
