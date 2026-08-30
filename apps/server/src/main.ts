import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AppConfigService } from './config/service/app-config.service';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const appConfig = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  app.use(cookieParser());

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // CORS configuration
  const corsOrigin = appConfig.get('app.corsOrigin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('operatio API')
    .setDescription(
      'Developer-focused uptime monitoring and incident management platform',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('monitors', 'Monitor management')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.use('/api/docs', apiReference({ content: document }));

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = appConfig.get('app.port');
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
