import { ProviderRequestError } from './types';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export async function providerFetch(
  providerKey: string,
  url: string,
  options: HttpRequestOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const retries = options.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = new ProviderRequestError(
          providerKey,
          `Upstream ${response.status}`,
          response.status,
        );
        await sleep(250 * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      await sleep(250 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ProviderRequestError(
    providerKey,
    `Request failed after retries: ${String(lastError)}`,
    undefined,
    lastError,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
