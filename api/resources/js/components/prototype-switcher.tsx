// PROTOTYPE tooling — floating bar that cycles ?variant= (← →) and picks ?page=.
// Never rendered in production builds.

import { useEffect } from 'react';

type Option = { key: string; name: string };

type Props = {
    variants: Option[];
    current: string;
    onChange: (key: string) => void;
    pages?: Option[];
    page?: string;
    onPage?: (key: string) => void;
};

export function PrototypeSwitcher({ variants, current, onChange, pages = [], page, onPage }: Props) {
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
        <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 items-center whitespace-nowrap justify-center gap-1 rounded-[22px] bg-[#ff00aa] p-1 font-mono text-[13px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] md:bottom-4">
            {pages.length > 0 && (
                <span className="flex gap-0.5 rounded-full bg-black/20 p-0.5">
                    {pages.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => onPage?.(p.key)}
                            className={`rounded-full px-2.5 py-1 ${p.key === page ? 'bg-white text-[#ff00aa]' : 'hover:bg-white/20'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </span>
            )}
            <button type="button" onClick={() => step(-1)} className="size-8 rounded-full hover:bg-white/20" aria-label="Previous variant">
                ←
            </button>
            <span className="px-1 whitespace-nowrap">
                {v.key} ({v.name})
            </span>
            <button type="button" onClick={() => step(1)} className="size-8 rounded-full hover:bg-white/20" aria-label="Next variant">
                →
            </button>
        </div>
    );
}
