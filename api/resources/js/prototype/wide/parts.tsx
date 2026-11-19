// PROTOTYPE (#50) — small shared atoms for the wide-screen variants. Layout lives in each
// variant; only these leaf pieces are shared, so the variants are free to disagree on structure.

import { formatSG } from '@gtrack/design';
import type { ReactNode } from 'react';
import { approachBands, CATS, type CatKey, games, puttingBands, rolling, week } from './data';

// sgTone's classes live in packages/design, which Tailwind doesn't scan (no @source for it in
// app.css), so they never get generated. Literal classes here instead.
const tone = (n: number) => (Math.abs(n) < 0.005 ? 'text-sg-zero' : n > 0 ? 'text-sg-positive' : 'text-sg-negative');

export function Sg({ n, className = '' }: { n: number; className?: string }) {
    return <span className={`font-extrabold tabular-nums ${tone(n)} ${className}`}>{formatSG(n)}</span>;
}

export const catBg: Record<CatKey, string> = { ott: 'bg-cat-ott', app: 'bg-cat-app', shg: 'bg-cat-shg', put: 'bg-cat-put' };

export function Cat({ k, long = false }: { k: CatKey; long?: boolean }) {
    const c = CATS.find((x) => x.key === k)!;
    return (
        <span className={`inline-flex w-max items-center gap-1.5 self-start rounded-[6px] ${catBg[k]} px-1.5 py-0.5 text-[11px] font-extrabold text-cat-foreground`}>
            {c.code}
            {long && <span className="font-bold">{c.name}</span>}
        </span>
    );
}

export function Panel({
    title,
    action,
    children,
    className = '',
}: {
    title?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-[24px] bg-surface p-6 ${className}`}>
            {(title || action) && (
                <header className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-[18px] font-bold">{title}</h2>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

export function Tile({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`rounded-[18px] bg-surface-secondary p-4 ${className}`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
    return <p className="text-[13px] font-bold text-muted">{children}</p>;
}

export function Primary({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <button type="button" className={`h-12 rounded-[12px] bg-accent px-5 text-[15px] font-bold text-accent-foreground ${className}`}>
            {children}
        </button>
    );
}

export function Ghost({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
    return (
        <button type="button" onClick={onClick} className={`h-10 rounded-[12px] border border-separator px-4 text-[14px] font-bold ${className}`}>
            {children}
        </button>
    );
}

/** A plain text field, as on desktop with a physical keyboard. */
export function Field({
    label,
    value,
    suffix,
    locked = false,
    sg = false,
    className = '',
}: {
    label?: string;
    value: string;
    suffix?: string;
    locked?: boolean;
    sg?: boolean;
    className?: string;
}) {
    return (
        <label className={`flex flex-col gap-1.5 ${className}`}>
            {label && <span className="text-[13px] font-bold text-muted">{label}</span>}
            <span
                className={`flex h-12 items-center gap-2 rounded-[12px] border px-3 ${
                    locked ? 'border-transparent bg-surface-tertiary' : 'border-field-border bg-field-background'
                }`}
            >
                {sg && <span className="text-muted">±</span>}
                <input
                    defaultValue={value}
                    readOnly={locked}
                    className={`w-full min-w-0 bg-transparent text-[16px] font-bold tabular-nums outline-none ${locked ? 'text-muted' : ''}`}
                />
                {suffix && <span className="text-[13px] text-muted">{suffix}</span>}
                {locked && <span className="text-[11px] font-extrabold text-muted uppercase">sum</span>}
            </span>
        </label>
    );
}

export function Keypad({ className = '' }: { className?: string }) {
    const keys = ['1', '2', '3', '⌫', '4', '5', '6', '', '7', '8', '9', '', '±', '0', '.', ''];
    return (
        <div className={`grid grid-cols-4 grid-rows-[repeat(4,52px)] gap-2 self-start ${className}`}>
            {keys.map((k, i) =>
                i === 7 ? (
                    <button key={i} type="button" className="row-span-3 rounded-[12px] bg-accent text-[17px] font-bold text-accent-foreground">
                        Next
                    </button>
                ) : k === '' ? null : (
                    <button key={i} type="button" className="h-12 rounded-[12px] bg-surface-secondary text-[18px] font-bold text-accent">
                        {k}
                    </button>
                ),
            )}
        </div>
    );
}

/** Approach miss cross: long / short / left / right percentages around a target. */
export function MissCross() {
    const cell = (label: string, v: string) => (
        <label className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-extrabold text-muted uppercase">{label}</span>
            <input defaultValue={v} className="h-10 w-16 rounded-[10px] border border-field-border bg-field-background text-center font-bold tabular-nums outline-none" />
        </label>
    );
    return (
        <div className="grid w-max grid-cols-3 items-center gap-2">
            <span />
            {cell('Long', '12%')}
            <span />
            {cell('Left', '18%')}
            <span className="mx-auto size-10 rounded-full border-2 border-highlight" />
            {cell('Right', '9%')}
            <span />
            {cell('Short', '31%')}
            <span />
        </div>
    );
}

export function BandGrid({ cat, cols = 'grid-cols-4' }: { cat: 'app' | 'put'; cols?: string }) {
    const bands = cat === 'app' ? approachBands : puttingBands;
    const vals = ['−0.42', '', '+0.18', '−0.30', '', '−0.11', '+0.05', '', '', '', ''];
    return (
        <div className={`grid gap-2 ${cols}`}>
            {bands.map((b, i) => (
                <label key={b} className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted">{b}</span>
                    <input
                        defaultValue={vals[i]}
                        placeholder="0.00"
                        className="h-10 w-full rounded-[10px] border border-field-border bg-field-background px-2 text-[14px] font-bold tabular-nums outline-none placeholder:text-muted/50"
                    />
                </label>
            ))}
        </div>
    );
}

/** Last 20 (resting grey) and Last 5 (category colour) rolling averages with a zero line. */
export function TrendLines({ cat, height = 120, axis = false }: { cat: CatKey; height?: number; axis?: boolean }) {
    const l5 = rolling(cat, 5);
    const l20 = rolling(cat, 20);
    const all = [...l5, ...l20, 0];
    const max = Math.max(...all) + 0.2;
    const min = Math.min(...all) - 0.2;
    const w = 400;
    const y = (v: number) => ((max - v) / (max - min)) * height;
    const path = (xs: number[]) => xs.map((v, i) => `${i ? 'L' : 'M'}${(i / (xs.length - 1)) * w},${y(v).toFixed(1)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full overflow-visible" style={{ height }}>
            {axis &&
                [max - 0.2, (max + min) / 2, min + 0.2].map((v) => (
                    <line key={v} x1={0} x2={w} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-separator" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                ))}
            <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-muted" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <path d={path(l20)} fill="none" stroke="var(--chart-bar)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            <path d={path(l5)} fill="none" stroke={`var(--cat-${cat})`} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

export function Legend() {
    return (
        <div className="flex gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-chart-bar" /> Last 20
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-accent" /> Last 5
            </span>
        </div>
    );
}

export function WeekStrip({ compact = false }: { compact?: boolean }) {
    return (
        <div className="grid grid-cols-7 gap-2">
            {week.map((d) => (
                <div
                    key={d.day}
                    className={`flex flex-col gap-1 rounded-[14px] p-2 ${d.today ? 'bg-highlight text-highlight-foreground' : 'bg-surface-secondary'} ${compact ? 'min-h-14' : 'min-h-24'}`}
                >
                    <span className="text-[12px] font-extrabold">{d.day}</span>
                    {!compact && <span className={`text-[12px] leading-tight ${d.today ? '' : 'text-muted'}`}>{d.label || '—'}</span>}
                    {d.done && <span className="mt-auto size-2 rounded-full bg-success" />}
                </div>
            ))}
        </div>
    );
}

export function StatusChip({ status }: { status: string }) {
    const tone =
        status === 'draft' ? 'bg-warning/20 text-warning' : status === 'retired' ? 'bg-surface-tertiary text-muted' : 'bg-success/15 text-success';
    return <span className={`rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold uppercase ${tone}`}>{status}</span>;
}

export const drafts = games.filter((g) => g.status === 'draft');
export const catalogue = games.filter((g) => g.status !== 'draft');

export const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
