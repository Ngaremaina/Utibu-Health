import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { User } from '@/api/types';

const ACCESS_KEY = 'utibu.accessToken';
const REFRESH_KEY = 'utibu.refreshToken';
const USER_KEY = 'utibu.user';

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// SecureStore (Keychain/Keystore) isn't available on web; fall back to AsyncStorage there.
const secure = {
  get: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

let current: Session | null = null;

export const tokenStorage = {
  /** Synchronous view of the in-memory session used by the API client. */
  get session(): Session | null {
    return current;
  },

  async load(): Promise<Session | null> {
    const [accessToken, refreshToken, rawUser] = await Promise.all([
      secure.get(ACCESS_KEY),
      secure.get(REFRESH_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    if (!accessToken || !refreshToken || !rawUser) {
      current = null;
      return null;
    }
    try {
      current = { accessToken, refreshToken, user: JSON.parse(rawUser) as User };
    } catch {
      current = null;
    }
    return current;
  },

  async save(session: Session): Promise<void> {
    current = session;
    await Promise.all([
      secure.set(ACCESS_KEY, session.accessToken),
      secure.set(REFRESH_KEY, session.refreshToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user)),
    ]);
  },

  async updateAccessToken(accessToken: string): Promise<void> {
    if (!current) return;
    current = { ...current, accessToken };
    await secure.set(ACCESS_KEY, accessToken);
  },

  async clear(): Promise<void> {
    current = null;
    await Promise.all([
      secure.remove(ACCESS_KEY),
      secure.remove(REFRESH_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};
