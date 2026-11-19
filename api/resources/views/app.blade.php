<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        {{-- A link, not the @import in gtrack-theme.css: Tailwind drops that. --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif&display=swap">
        {{-- The golfer's theme choice before first paint, so a Light page never flashes Dark. resources/js/lib/theme.ts keeps it up to date. --}}
        <script>
            (function () {
                var choice = null;
                try { choice = localStorage.getItem('gtrack.theme'); } catch (e) {}
                var theme = choice === 'dark' || choice === 'light'
                    ? choice
                    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                document.documentElement.dataset.theme = theme;
                document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
        </script>
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-background text-foreground antialiased">
        @inertia
    </body>
</html>
