import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { fail } from '../utils/api-response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>;
        message = String(record.message ?? message);
        details = record.message;
        if (Array.isArray(record.message)) {
          message = 'Validation failed';
          details = record.message;
          code = 'VALIDATION_ERROR';
        } else if (typeof record.error === 'string') {
          code = record.error.toUpperCase().replace(/\s+/g, '_');
        }
      }
      if (status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHORIZED';
      if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
      if (status === HttpStatus.CONFLICT) code = 'CONFLICT';
      if (status === HttpStatus.BAD_REQUEST && code === 'INTERNAL_ERROR') {
        code = 'BAD_REQUEST';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message;
    } else {
      this.logger.error(`Unknown exception: ${String(exception)}`);
    }

    response.status(status).json(fail(code, message, details));
  }
}
