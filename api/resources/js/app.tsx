import '../css/app.css';

import { RouterProvider } from '@heroui/react';
import { createInertiaApp, router } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', { eager: true });

createInertiaApp({
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
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
