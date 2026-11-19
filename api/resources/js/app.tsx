import '../css/app.css';

import { RouterProvider } from '@heroui/react';
import { createInertiaApp, router } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './layouts/app-shell';
import './lib/theme';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', { eager: true });

createInertiaApp({
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        return page.default;
    },
    // Every page but sign-in sits in the shell; a page gives it a title through its own `layout`.
    layout: (name) => (name.startsWith('auth/') ? null : AppShell),
    setup({ el, App, props }) {
        // HeroUI links and buttons with an href navigate through Inertia, not a full page load.
        createRoot(el).render(
            <RouterProvider navigate={(href) => router.visit(href)}>
                <App {...props} />
            </RouterProvider>,
        );
    },
});
