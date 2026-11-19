import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        // The shared packages live in the pnpm workspace, which this app sits outside.
        alias: {
            '@gtrack/types': fileURLToPath(new URL('../packages/types/src/index.ts', import.meta.url)),
            '@gtrack/design': fileURLToPath(new URL('../packages/design/src/index.ts', import.meta.url)),
        },
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
