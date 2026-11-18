// PROTOTYPE tooling — floating bar that cycles ?variant= between prototype variants.
// Never rendered in production builds.

import { useEffect } from 'react';

type Props = {
    variants: { key: string; name: string }[];
    current: string;
    onChange: (key: string) => void;
};

export function PrototypeSwitcher({ variants, current, onChange }: Props) {
    const index = Math.max(
        0,
        variants.findIndex((v) => v.key === current),
    );
    const step = (delta: number) => onChange(variants[(index + delta + variants.length) % variants.length].key);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            if (el && (el.matches('input, textarea, select') || el.isContentEditable)) return;
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (import.meta.env.PROD) return null;

    const v = variants[index];
    return (
        <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#ff00aa] p-1 font-mono text-[13px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] md:bottom-4">
            <button type="button" onClick={() => step(-1)} className="size-8 rounded-full hover:bg-white/20" aria-label="Previous variant">
                ←
            </button>
            <span className="px-2 whitespace-nowrap">
                PROTOTYPE {v.key} ({v.name})
            </span>
            <button type="button" onClick={() => step(1)} className="size-8 rounded-full hover:bg-white/20" aria-label="Next variant">
                →
            </button>
        </div>
    );
}
