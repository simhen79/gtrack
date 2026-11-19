import { useSyncExternalStore } from 'react';

/** What the golfer picks in the avatar menu. System follows the device. */
export type ThemeChoice = 'system' | 'dark' | 'light';

// The root template reads the same key before first paint.
const STORAGE_KEY = 'gtrack.theme';

const lightDevice = window.matchMedia('(prefers-color-scheme: light)');
const listeners = new Set<() => void>();

let choice: ThemeChoice = readChoice();
let range = false;

function readChoice(): ThemeChoice {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'dark' || stored === 'light' ? stored : 'system';
    } catch {
        return 'system';
    }
}

/** Sets `data-theme` on `<html>`: Range while it's on, else the choice, with System resolved by the device. */
function apply() {
    const theme = range ? 'range' : choice === 'system' ? (lightDevice.matches ? 'light' : 'dark') : choice;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme !== 'light');
}

lightDevice.addEventListener('change', apply);
apply();

/** Applies the choice at once and remembers it in this browser. */
export function setThemeChoice(next: ThemeChoice) {
    choice = next;
    try {
        if (next === 'system') {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, next);
        }
    } catch {
        // Storage can be off (private browsing): the choice still holds until reload.
    }
    apply();
    listeners.forEach((listener) => listener());
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
