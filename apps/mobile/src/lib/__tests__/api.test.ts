import { api, getToken, setToken, SignedOut } from '../api';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => void store.set(key, value),
    deleteItemAsync: async (key: string) => void store.delete(key),
  };
});

const respond = (status: number, body?: unknown) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => jest.restoreAllMocks());

it('sends the stored token and returns the body', async () => {
  await setToken('abc');
  const fetch = respond(200, { email: 'golfer@example.com' });

  await expect(api('/me')).resolves.toEqual({ email: 'golfer@example.com' });
  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer abc' });
});

it('forgets the token when the server answers 401', async () => {
  await setToken('abc');
  respond(401, { message: 'Unauthenticated.' });

  await expect(api('/me')).rejects.toBeInstanceOf(SignedOut);
  expect(await getToken()).toBeNull();
});
