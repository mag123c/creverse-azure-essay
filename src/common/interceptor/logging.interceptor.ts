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

        /**
         * Error 인터페이스를 확장해서 Warn, Error를 구분한 뒤
         * Warn은 임계치를 초과 시, Error은 즉시 알림을 남길 수 있도록,
         * Loki같은 로그 에이전트를 같이 사용하게 되면, 유연한 로그 관리를 위해 로그 전용 매니저 인터페이스를 두어
         * 로그를 에러 인스턴스에 따라 동적으로 생성하고, 알림은 모니터링 인프라쪽에서 구성하는 편입니다.
         * 현재 어디로 알림을 보내야한다. 라는 요구사항은 없어, 또 result: failed 상황은
         * 컨텍스트 끝자락의 catchError에서 캐치가 가능하기 때문에 이 구간에 알림을 보내는 코드를 작성할 것 같습니다.
         */
        // sendAlert(message, stack, userCtx).catch((err) => {
        //   this.logger.warn(`sendAlert 실패: ${err.message}`);
        // });

        return throwError(() => error);
      }),
    );
  }
}
