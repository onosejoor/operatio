import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { loggerConfig } from './common/logger/logger.config';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: loggerConfig,
    }),
    PrismaModule,
    RedisModule,
    QueuesModule,
    HealthModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
