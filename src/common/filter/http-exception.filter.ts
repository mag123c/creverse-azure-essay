import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  result: string;
  message: string;
  path?: string;
  stack?: string;
  body?: any;
}

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message = exception.message ?? 'Internal Server Error';

    const json: ErrorResponse = {
      result: 'failed',
      message: message,
    };

    if (process.env.NODE_ENV !== 'dev') {
      json['path'] = request.url;
      json['stack'] = exception.stack;
      json['body'] = request.body;
    }

    response.status(200).json(json);
  }
}
