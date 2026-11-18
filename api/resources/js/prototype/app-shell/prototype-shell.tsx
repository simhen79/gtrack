// PROTOTYPE (#51 app shell) — throwaway. Branch prototype/51-app-shell only.
// Question: what should the web app shell look like? Three structurally different shells
// wrap every signed-in page, switchable with ?variant=A|B|C (or ← / → keys).
// A = the design system's top bar, B = sidebar + phone tab bar, C = hub + launcher.

import { usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import { PrototypeSwitcher } from '../../components/prototype-switcher';
import { readThemeChoice, THEME_EVENT } from './parts';
import VariantA, { name as nameA } from './variant-a-top-bar';
import VariantB, { name as nameB } from './variant-b-sidebar';
import VariantC, { name as nameC } from './variant-c-hub';

const variants = [
    { key: 'A', name: nameA, Shell: VariantA },
    { key: 'B', name: nameB, Shell: VariantB },
    { key: 'C', name: nameC, Shell: VariantC },
];

const STORAGE_KEY = 'prototype-shell-variant';

function readVariant(): string {
    const fromUrl = new URLSearchParams(window.location.search).get('variant');
    if (fromUrl) return fromUrl.toUpperCase();
    try {
        return sessionStorage.getItem(STORAGE_KEY) ?? 'A';
    } catch {
        return 'A';
    }
}

/** Keep ?variant= in the address bar after Inertia visits drop it, so reloads and links stay on the variant. */
function writeVariant(key: string) {
    try {
        sessionStorage.setItem(STORAGE_KEY, key);
    } catch {
        /* prototype: ignore */
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get('variant') !== key) {
        url.searchParams.set('variant', key);
        window.history.replaceState(window.history.state, '', url);
    }
}

/** Apply the golfer's theme choice (System / Dark / Light, default System); see parts.tsx ThemePicker. */
function useSystemTheme() {
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const apply = () => {
            const choice = readThemeChoice();
            const theme = choice === 'system' ? (mq.matches ? 'light' : 'dark') : choice;
            document.documentElement.dataset.theme = theme;
            document.documentElement.classList.toggle('dark', theme === 'dark');
        };
        apply();
        mq.addEventListener('change', apply);
        window.addEventListener(THEME_EVENT, apply);
        return () => {
            mq.removeEventListener('change', apply);
            window.removeEventListener(THEME_EVENT, apply);
        };
    }, []);
}

export default function PrototypeShell({ children }: { children: ReactNode }) {
    const { url } = usePage();
    const [variant, setVariant] = useState(readVariant);
    useSystemTheme();

    // Re-apply after every Inertia visit, which replaces the URL without our param.
    useEffect(() => writeVariant(variant), [variant, url]);

    const current = variants.find((v) => v.key === variant) ?? variants[0];

    return (
        <>
            <current.Shell>{children}</current.Shell>
            <PrototypeSwitcher variants={variants} current={current.key} onChange={setVariant} />
        </>
    );
}
