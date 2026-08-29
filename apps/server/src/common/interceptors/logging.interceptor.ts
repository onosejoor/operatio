import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, requestId, userId, organizationId } = request;
    const now = Date.now();

    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      requestId,
      userId,
      organizationId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log({
            message: 'Request completed',
            method,
            url,
            requestId,
            userId,
            organizationId,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error({
            message: 'Request failed',
            method,
            url,
            requestId,
            userId,
            organizationId,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}
