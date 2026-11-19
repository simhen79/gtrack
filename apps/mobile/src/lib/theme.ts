import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Uniwind } from 'uniwind';

/** What the golfer picks in the avatar sheet. System follows the device. */
export type ThemeChoice = 'system' | 'dark' | 'light';

const STORAGE_KEY = 'gtrack.theme';
const listeners = new Set<() => void>();

let choice: ThemeChoice = 'system';
let range = false;

function apply() {
  Uniwind.setTheme(range ? 'range' : choice);
}

/** Applies the choice saved on this device. Run it before the first screen shows. */
export async function loadThemeChoice() {
  // An unreadable keychain falls back to System rather than holding the splash screen.
  const stored = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  choice = stored === 'dark' || stored === 'light' ? stored : 'system';
  apply();
  listeners.forEach((listener) => listener());
}

/** Applies the choice at once and remembers it on this device. */
export async function setThemeChoice(next: ThemeChoice) {
  choice = next;
  apply();
  listeners.forEach((listener) => listener());
  // If the keychain refuses, the choice still holds until the app restarts.
  await SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
}

/** The live Practice Session switches Range on and off, whatever the golfer chose. */
export function setRangeTheme(on: boolean) {
  range = on;
  apply();
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => choice,
  );
}

/**
 * Font families as the root layout loads them. A custom font has one weight per family on
 * React Native, so bold text names its family rather than setting a weight.
 */
export const fonts = {
  body: 'Manrope',
  bold: 'Manrope-Bold',
  extraBold: 'Manrope-ExtraBold',
  serif: 'InstrumentSerif',
} as const;
