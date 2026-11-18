import '../css/app.css';

import { RouterProvider } from '@heroui/react';
import { createInertiaApp, router } from '@inertiajs/react';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import PrototypeShell from './prototype/app-shell/prototype-shell';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', { eager: true });

createInertiaApp({
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        // PROTOTYPE (#51): wrap every signed-in page in the variant shell.
        if (!name.startsWith('auth/')) {
            (page.default as ComponentType & { layout?: unknown }).layout = (child: ReactNode) => (
                <PrototypeShell>{child}</PrototypeShell>
            );
        }
        return page.default;
    },
    setup({ el, App, props }) {
        // HeroUI links and buttons with an href navigate through Inertia, not a full page load.
        createRoot(el).render(
            <RouterProvider navigate={(href) => router.visit(href)}>
                <App {...props} />
            </RouterProvider>,
        );
    },
});
