import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { tokenStorage } from '@/storage/tokenStorage';

import { ApiError, createApiClient, onSessionExpired, toApiError } from '../client';

type Handler = (config: InternalAxiosRequestConfig) => [number, unknown];

function makeClient(handler: Handler) {
  const calls: InternalAxiosRequestConfig[] = [];
  const client = createApiClient({
    baseURL: 'http://api.test/api/v1',
    adapter: async (config) => {
      calls.push(config);
      const [status, data] = handler(config);
      const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
      if (status >= 400) {
        throw new AxiosError('Request failed', undefined, config, undefined, response);
      }
      return response;
    },
  });
  return { client, calls };
}

const user = { id: 1, email: 'a@b.co', username: 'a', is_admin: false, created_at: '' };

beforeEach(async () => {
  await tokenStorage.clear();
  onSessionExpired(null);
});

it('attaches the access token', async () => {
  await tokenStorage.save({ accessToken: 'access-1', refreshToken: 'refresh-1', user });
  const { client, calls } = makeClient(() => [200, { ok: true }]);
  await client.get('/cart');
  expect(calls[0]?.headers.Authorization).toBe('Bearer access-1');
});

it('converts API error bodies into ApiError', async () => {
  const { client } = makeClient(() => [
    422,
    {
      error: {
        code: 'validation_error',
        message: 'Validation failed.',
        details: { email: ['Bad email.'] },
      },
    },
  ]);
  const error = await client.post('/auth/register', {}).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(422);
  expect((error as ApiError).fieldErrors).toEqual({ email: 'Bad email.' });
});

it('refreshes an expired access token once and retries', async () => {
  await tokenStorage.save({ accessToken: 'old', refreshToken: 'refresh-1', user });
  const { client, calls } = makeClient((config) => {
    if (config.url === '/auth/refresh') return [200, { access_token: 'new' }];
    return config.headers.Authorization === 'Bearer new'
      ? [200, { items: [] }]
      : [401, { error: { code: 'token_expired', message: 'Token has expired.' } }];
  });

  const [a, b] = await Promise.all([client.get('/cart'), client.get('/orders')]);

  expect(a.data).toEqual({ items: [] });
  expect(b.data).toEqual({ items: [] });
  expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  expect(calls.find((c) => c.url === '/auth/refresh')?.headers.Authorization).toBe(
    'Bearer refresh-1',
  );
  expect(tokenStorage.session?.accessToken).toBe('new');
});

it('signs out when the refresh token is rejected', async () => {
  await tokenStorage.save({ accessToken: 'old', refreshToken: 'bad', user });
  const expired = jest.fn();
  onSessionExpired(expired);
  const { client } = makeClient(() => [401, { error: { code: 'invalid_token', message: 'no' } }]);

  const error = await client.get('/cart').catch((e: unknown) => e);

  expect((error as ApiError).code).toBe('session_expired');
  expect(expired).toHaveBeenCalledTimes(1);
  expect(tokenStorage.session).toBeNull();
});

it('does not try to refresh failed logins', async () => {
  const { client, calls } = makeClient(() => [
    401,
    { error: { code: 'invalid_credentials', message: 'Invalid email or password.' } },
  ]);
  const error = await client.post('/auth/login', {}).catch((e: unknown) => e);
  expect((error as ApiError).message).toBe('Invalid email or password.');
  expect(calls).toHaveLength(1);
});

describe('toApiError', () => {
  it('reports network failures', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(error.code).toBe('network_error');
    expect(error.status).toBeNull();
  });

  it('wraps unknown errors', () => {
    expect(toApiError(new Error('x')).code).toBe('unknown');
  });
});
