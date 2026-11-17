import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gtrack.token';
const baseUrl = process.env.EXPO_PUBLIC_API_URL;

/** The server refused the token: it's idle, revoked or the login is disabled. */
export class SignedOut extends Error {}

/** The server rejected the input, with messages keyed by field. */
export class Invalid extends Error {
  constructor(public errors: Record<string, string[]>) {
    super(Object.values(errors).flat()[0] ?? 'Something went wrong.');
  }
}

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const setToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

/**
 * Calls the Laravel JSON API with the stored token. A 401 forgets the token and
 * throws SignedOut, so the caller can return to sign-in.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL isn’t set. Add it to apps/mobile/.env.local and restart Metro.');
  }
  const token = await getToken();
  const response = await fetch(`${baseUrl}/api${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (response.status === 401) {
    await clearToken();
    throw new SignedOut();
  }
  if (response.status === 422) {
    throw new Invalid((await response.json()).errors);
  }
  if (!response.ok) {
    throw new Error(`The server answered ${response.status}.`);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}
