import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LatencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    return next.handle().pipe(
      map((responseBody) => {
        const latency = Date.now() - start;

        return {
          ...(responseBody ?? {}),
          apiLatency: latency,
        };
      }),
    );
  }
}
