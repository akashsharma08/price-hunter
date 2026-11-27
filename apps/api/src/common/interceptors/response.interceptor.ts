import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ok, type ApiSuccessResponse, type PaginationMeta } from '../utils/api-response';

interface PayloadWithMeta<T> {
  data: T;
  meta?: PaginationMeta;
}

function hasMetaEnvelope<T>(value: unknown): value is PayloadWithMeta<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    !('success' in value)
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          (payload as { success: unknown }).success === true
        ) {
          return payload as unknown as ApiSuccessResponse<T>;
        }
        if (hasMetaEnvelope<T>(payload)) {
          return ok(payload.data, payload.meta);
        }
        return ok(payload as T);
      }),
    );
  }
}
