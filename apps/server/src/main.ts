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
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const appConfig = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            'cdn.jsdelivr.net',
            'https://cdn.jsdelivr.net',
          ],
          'script-src-elem': [
            "'self'",
            "'unsafe-inline'",
            'cdn.jsdelivr.net',
            'https://cdn.jsdelivr.net',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'cdn.jsdelivr.net',
            'https://cdn.jsdelivr.net',
          ],
          'img-src': [
            "'self'",
            'data:',
            'cdn.jsdelivr.net',
            'https://cdn.jsdelivr.net',
          ],
        },
      },
    }),
  );
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
  const appOrigin = appConfig.get('app.appOrigin') || '';
  const corsOrigin = appConfig.get('app.corsOrigin');

  app.enableCors({
    origin: (origin, callback) => {
      console.log({ origin, corsOrigin, appOrigin });
      // 1. Allow server-to-server or API tools (Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigin.split(',').includes(origin)) {
        return callback(null, true);
      }

      try {
        const escapedDomain = appOrigin.replace(/\./g, '\\.');

        const dynamicRegex = new RegExp(
          `^https?:\/\/([a-z0-9-]+.)*${escapedDomain}(:[0-9]+)?$`,
          'i',
        );

        if (dynamicRegex.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`), false);
        }
      } catch (error) {
        // Fallback safety if the regex creation fails
        callback(new Error('Invalid CORS configuration setup'), false);
      }
    },
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
