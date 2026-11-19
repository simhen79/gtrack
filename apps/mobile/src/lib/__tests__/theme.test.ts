import * as SecureStore from 'expo-secure-store';
import { Uniwind } from 'uniwind';
import { loadThemeChoice, setThemeChoice } from '../theme';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock('uniwind', () => ({ Uniwind: { setTheme: jest.fn() } }));

afterEach(() => jest.clearAllMocks());

it('applies the choice at once even when the device cannot remember it', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('Keychain unavailable'));

  await expect(setThemeChoice('light')).resolves.toBeUndefined();
  expect(Uniwind.setTheme).toHaveBeenLastCalledWith('light');
});

it('follows the device when the saved choice cannot be read', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain unavailable'));

  await expect(loadThemeChoice()).resolves.toBeUndefined();
  expect(Uniwind.setTheme).toHaveBeenLastCalledWith('system');
});
