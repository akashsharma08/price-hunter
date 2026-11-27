import type { ApiEnvelope, ApiPaginationMeta } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type TokenGetter = () => string | null;
type TokenRefresher = () => Promise<string | null>;

let getAccessToken: TokenGetter = () => null;
let refreshTokens: TokenRefresher = async () => null;

export function configureApiAuth(options: {
  getAccessToken: TokenGetter;
  refreshTokens: TokenRefresher;
}) {
  getAccessToken = options.getAccessToken;
  refreshTokens = options.refreshTokens;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiPaginationMeta;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retry) {
    const next = await refreshTokens();
    if (next) {
      return apiRequest<T>(path, init, false);
    }
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new ApiError(
      payload.error.message,
      response.status,
      payload.error.code,
      payload.error.details,
    );
  }

  return {
    data: payload.data,
    meta: payload.meta,
  };
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown, options?: { retry?: boolean }) {
  return apiRequest<T>(
    path,
    {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options?.retry ?? true,
  );
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: 'DELETE' });
}

export { API_BASE_URL };
