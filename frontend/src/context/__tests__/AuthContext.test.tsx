import { act, renderHook, waitFor } from '@testing-library/react-native';

import { api } from '@/api';
import { tokenStorage } from '@/storage/tokenStorage';

import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  api: { auth: { login: jest.fn(), register: jest.fn() } },
}));

const user = {
  id: 1,
  email: 'jane@example.com',
  username: 'jane',
  is_admin: false,
  created_at: '',
};
const authResponse = { access_token: 'a', refresh_token: 'r', user };

async function renderAuth() {
  const hook = await renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(hook.result.current.status).not.toBe('loading'));
  return hook;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenStorage.clear();
});

it('starts signed out without a stored session', async () => {
  const { result } = await renderAuth();
  expect(result.current.status).toBe('signedOut');
  expect(result.current.user).toBeNull();
});

it('restores a stored session', async () => {
  await tokenStorage.save({ accessToken: 'a', refreshToken: 'r', user });
  const { result } = await renderAuth();
  expect(result.current.status).toBe('signedIn');
  expect(result.current.user?.email).toBe('jane@example.com');
});

it('signs in, persists tokens and signs out', async () => {
  jest.mocked(api.auth.login).mockResolvedValue(authResponse);
  const { result } = await renderAuth();

  await act(() => result.current.signIn(' jane@example.com ', 'password123'));

  expect(api.auth.login).toHaveBeenCalledWith('jane@example.com', 'password123');
  expect(result.current.status).toBe('signedIn');
  expect((await tokenStorage.load())?.accessToken).toBe('a');

  await act(() => result.current.signOut());
  expect(result.current.status).toBe('signedOut');
  expect(await tokenStorage.load()).toBeNull();
});

it('signs up', async () => {
  jest.mocked(api.auth.register).mockResolvedValue(authResponse);
  const { result } = await renderAuth();
  await act(() => result.current.signUp('jane', 'jane@example.com', 'password123'));
  expect(api.auth.register).toHaveBeenCalledWith('jane', 'jane@example.com', 'password123');
  expect(result.current.status).toBe('signedIn');
});

it('keeps the user signed out when login fails', async () => {
  jest.mocked(api.auth.login).mockRejectedValue(new Error('nope'));
  const { result } = await renderAuth();
  await expect(act(() => result.current.signIn('jane@example.com', 'bad'))).rejects.toThrow('nope');
  expect(result.current.status).toBe('signedOut');
});

it('throws when used outside the provider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(() => useAuth())).rejects.toThrow(
    'useAuth must be used inside <AuthProvider>',
  );
});
