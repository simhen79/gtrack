import { useEffect, useState } from 'react';

/**
 * PROTOTYPE ONLY. Picks a UI variant from `?variant=` and shows a floating bar to cycle through
 * them with the arrows or ← →. Renders nothing in a production build.
 */
export function useVariant<K extends string>(keys: readonly K[]): K {
    const read = () => {
        const value = new URLSearchParams(window.location.search).get('variant')?.toUpperCase();
        return (keys.find((key) => key === value) ?? keys[0]) as K;
    };
    const [variant, setVariant] = useState<K>(read);

    useEffect(() => {
        const onChange = () => setVariant(read());
        window.addEventListener('prototype-variant', onChange);
        return () => window.removeEventListener('prototype-variant', onChange);
    });

    return variant;
}

export function PrototypeSwitcher<K extends string>({ variants, current, state }: { variants: { key: K; name: string }[]; current: K; state?: unknown }) {
    const [showState, setShowState] = useState(false);
    const index = variants.findIndex((variant) => variant.key === current);

    const go = (step: number) => {
        const next = variants[(index + step + variants.length) % variants.length];
        const url = new URL(window.location.href);
        url.searchParams.set('variant', next.key);
        window.history.replaceState(window.history.state, '', url);
        window.dispatchEvent(new Event('prototype-variant'));
    };

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('input, textarea, [contenteditable]')) return;
            if (event.key === 'ArrowLeft') go(-1);
            if (event.key === 'ArrowRight') go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!import.meta.env.DEV) return null;

    return (
        <div className="fixed bottom-24 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-4">
            {showState && (
                <pre className="max-h-72 w-[min(90vw,520px)] overflow-auto rounded-xl bg-black/90 p-3 text-[11px] text-lime-200 shadow-2xl">
                    {JSON.stringify(state, null, 2)}
                </pre>
            )}
            <div className="flex items-center gap-1 rounded-full bg-black px-2 py-1.5 text-[13px] font-bold text-white shadow-2xl ring-2 ring-fuchsia-500">
                <button type="button" className="rounded-full px-3 py-1 hover:bg-white/20" onClick={() => go(-1)} aria-label="Previous variant">
                    ←
                </button>
                <span className="px-2 whitespace-nowrap">
                    PROTOTYPE · {current} ({variants[index]?.name})
                </span>
                <button type="button" className="rounded-full px-3 py-1 hover:bg-white/20" onClick={() => go(1)} aria-label="Next variant">
                    →
                </button>
                {state !== undefined && (
                    <button type="button" className="rounded-full px-3 py-1 text-fuchsia-300 hover:bg-white/20" onClick={() => setShowState((shown) => !shown)}>
                        state
                    </button>
                )}
            </div>
        </div>
    );
}
