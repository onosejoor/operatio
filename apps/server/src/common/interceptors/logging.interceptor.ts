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

    this.logger.log(
      `→ ${method} ${url} [req:${requestId}] [user:${userId ?? '-'}] [org:${organizationId ?? '-'}]`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.logger.log(
            `← ${method} ${url} ${statusCode} ${duration}ms [req:${requestId}] [user:${userId ?? '-'}] [org:${organizationId ?? '-'}]`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error?.status ?? error?.statusCode ?? 500;
          this.logger.error(
            `✖ ${method} ${url} ${statusCode} ${duration}ms [req:${requestId}] [user:${userId ?? '-'}] [org:${organizationId ?? '-'}] — ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
