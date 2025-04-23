import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, HttpException } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        const duration = `${Date.now() - startTime}ms`;
        const baseMessage = `${method} ${url} ${duration}` + (user ? `User: ${user.id}` : '');
        this.logger.log(`${baseMessage}`, 'Request');
      }),
      catchError((error) => {
        const duration = `${Date.now() - startTime}ms`;
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        const stack = error.stack;
        const userId = request.user?.id ?? 'anonymous';
        const userCtx = `User: ${userId}`;

        const message = `[${statusCode}] ${method} ${url} ${duration} ${error.message}`;

        this.logger.error(message, stack, userCtx);

        return throwError(() => error);
      }),
    );
  }
}
