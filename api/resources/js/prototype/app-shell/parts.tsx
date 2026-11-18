// PROTOTYPE (#51 app shell) — throwaway. Small pieces every variant may reuse.
// Deliberately hand-rolled (no HeroUI Dropdown/Drawer) so the prototype stays quick;
// the real build uses the components named in the issue's Design section.

import { ArrowRightFromSquare } from '@gravity-ui/icons';
import { Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { initials, type NavItem } from './nav';

export function Wordmark({ size = 'md', markOnly = false }: { size?: 'md' | 'lg'; markOnly?: boolean }) {
    const ring = size === 'lg' ? 'size-7 border-[5px]' : 'size-5 border-4';
    const dot = size === 'lg' ? 'size-2.5' : 'size-1.5';
    return (
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className={`flex items-center justify-center rounded-full border-accent ${ring}`}>
                <span className={`rounded-full bg-highlight ${dot}`} />
            </span>
            {!markOnly && <span className={size === 'lg' ? 'text-2xl' : 'text-lg'}>gtrack</span>}
        </Link>
    );
}

export function Avatar({ email }: { email?: string }) {
    return (
        <span className="flex size-10 items-center justify-center rounded-full bg-highlight text-sm font-extrabold text-highlight-foreground">
            {initials(email)}
        </span>
    );
}

export type ThemeChoice = 'system' | 'dark' | 'light';
export const THEME_EVENT = 'prototype-theme-change';
const THEME_KEY = 'prototype-theme';

export function readThemeChoice(): ThemeChoice {
    try {
        const v = localStorage.getItem(THEME_KEY);
        return v === 'dark' || v === 'light' ? v : 'system';
    } catch {
        return 'system';
    }
}

/** System / Dark / Light, remembered per browser, default System (decided for #51). */
function ThemePicker() {
    const [choice, setChoice] = useState(readThemeChoice);
    const pick = (c: ThemeChoice) => {
        try {
            localStorage.setItem(THEME_KEY, c);
        } catch {
            /* prototype: ignore */
        }
        setChoice(c);
        window.dispatchEvent(new Event(THEME_EVENT));
    };
    return (
        <div className="mx-1.5 mb-1 flex gap-1 rounded-[14px] bg-surface-secondary p-1">
            {(['system', 'dark', 'light'] as const).map((c) => (
                <button
                    key={c}
                    type="button"
                    onClick={() => pick(c)}
                    className={`h-8 flex-1 rounded-[10px] text-[13px] font-bold capitalize ${
                        choice === c ? 'bg-segment text-segment-foreground' : ''
                    }`}
                >
                    {c}
                </button>
            ))}
        </div>
    );
}

/** Avatar button with a tiny popover menu: email, theme, Sign out. */
export function AvatarMenu({
    email,
    align = 'right',
    links = [],
}: {
    email?: string;
    align?: 'right' | 'left' | 'up';
    links?: NavItem[];
}) {
    const [open, setOpen] = useState(false);
    const position =
        align === 'up' ? 'bottom-12 left-0' : align === 'left' ? 'top-12 left-0' : 'top-12 right-0';
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-label="Account">
                <Avatar email={email} />
            </button>
            {open && (
                <div
                    className={`absolute z-40 w-64 rounded-[18px] bg-overlay p-1.5 [box-shadow:var(--overlay-shadow)] ${position}`}
                >
                    <p className="truncate px-3 py-2 text-[13px] text-muted">{email}</p>
                    <ThemePicker />
                    {links.map((item) => (
                        <NavLink
                            key={item.label}
                            item={item}
                            onNavigate={() => setOpen(false)}
                            className="flex h-10 items-center gap-2 rounded-[12px] px-3 hover:bg-surface-tertiary"
                        >
                            <item.icon className="size-4" /> {item.label}
                        </NavLink>
                    ))}
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="flex h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-danger hover:bg-surface-tertiary"
                    >
                        <ArrowRightFromSquare className="size-4" /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

/** Primary action. One per view: the orange. */
export function EnterRoundButton({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
    return (
        <Link
            href="/rounds/create"
            className={`inline-flex h-10 items-center justify-center rounded-[12px] bg-accent px-4 text-[15px] font-bold whitespace-nowrap text-accent-foreground ${className}`}
        >
            {compact ? '+ Round' : 'Enter a Round'}
        </Link>
    );
}

/** A nav link, or a greyed "not built yet" placeholder when href is null. */
export function NavLink({
    item,
    className,
    children,
    onNavigate,
    title,
}: {
    item: NavItem;
    className: string;
    children: ReactNode;
    onNavigate?: () => void;
    title?: string;
}) {
    if (item.href === null) {
        return (
            <span className={`${className} cursor-not-allowed opacity-40`} title={`${title ? `${title}: ` : ''}Not built yet`}>
                {children}
            </span>
        );
    }
    return (
        <Link href={item.href} className={className} onClick={onNavigate} title={title}>
            {children}
        </Link>
    );
}
