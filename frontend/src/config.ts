const DEFAULT_API_URL = 'http://localhost:5000/api/v1';

// EXPO_PUBLIC_* variables are inlined at build time.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = 15_000;
