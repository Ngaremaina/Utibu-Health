import {
  AxiosError,
  create,
  isAxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_URL, REQUEST_TIMEOUT_MS } from '@/config';
import { tokenStorage } from '@/storage/tokenStorage';

import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level validation messages from a 422 response, flattened to one string per field. */
  get fieldErrors(): Record<string, string> {
    if (this.code !== 'validation_error' || !this.details || typeof this.details !== 'object') {
      return {};
    }
    return Object.fromEntries(
      Object.entries(this.details as Record<string, unknown>).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? String(messages[0]) : String(messages),
      ]),
    );
  }
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorBody).error?.message === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const data: unknown = error.response?.data;
    if (isApiErrorBody(data)) {
      return new ApiError(data.error.message, status, data.error.code, data.error.details);
    }
    if (!error.response) {
      return new ApiError(
        'Unable to reach the server. Check your connection and try again.',
        null,
        'network_error',
      );
    }
    return new ApiError(`Request failed (${status}).`, status, 'http_error');
  }
  return new ApiError('Something went wrong.', null, 'unknown');
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export interface ApiClientOptions {
  baseURL?: string;
  adapter?: AxiosAdapter;
}

let sessionExpiredHandler: (() => void) | null = null;

/** Registers a callback fired when the refresh token is rejected (the user must sign in again). */
export function onSessionExpired(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export function createApiClient({
  baseURL = API_URL,
  adapter,
}: ApiClientOptions = {}): AxiosInstance {
  const instance = create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(adapter ? { adapter } : {}),
  });

  let refreshInFlight: Promise<string> | null = null;

  const refreshAccessToken = async (): Promise<string> => {
    const refreshToken = tokenStorage.session?.refreshToken;
    if (!refreshToken) throw new ApiError('Session expired.', 401, 'session_expired');
    const { data } = await instance.post<{ access_token: string }>('/auth/refresh', undefined, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    await tokenStorage.updateAccessToken(data.access_token);
    return data.access_token;
  };

  instance.interceptors.request.use((config) => {
    const token = tokenStorage.session?.accessToken;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined;
      const isAuthCall = AUTH_PATHS.some((path) => config?.url?.startsWith(path));

      if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
        config._retried = true;
        try {
          // Share one refresh between concurrent 401s.
          refreshInFlight ??= refreshAccessToken().finally(() => {
            refreshInFlight = null;
          });
          const token = await refreshInFlight;
          config.headers.Authorization = `Bearer ${token}`;
          return instance(config);
        } catch {
          await tokenStorage.clear();
          sessionExpiredHandler?.();
          throw new ApiError(
            'Your session has expired. Please sign in again.',
            401,
            'session_expired',
          );
        }
      }
      throw toApiError(error);
    },
  );

  return instance;
}

export const http = createApiClient();
