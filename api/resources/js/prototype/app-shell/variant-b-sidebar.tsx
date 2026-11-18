// PROTOTYPE (#51 app shell) — Variant B: "Sidebar + tab bar".
// Desktop: a fixed left sidebar (wordmark, Enter a Round, labelled nav with icons, Admin as a
// nested section, account at the bottom). Content gets the full remaining width.
// Phone width: no menu button at all — a bottom tab bar like a native app, with Enter a Round
// as a raised centre button. Admin pages show their sub-nav as a top strip.

import { ChevronsLeft, ChevronsRight, Plus } from '@gravity-ui/icons';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { SharedProps } from '../../types';
import { adminNav, adminPill, golferNav, isCurrent, pageTitle } from './nav';
import { AvatarMenu, EnterRoundButton, NavLink, Wordmark } from './parts';

export const name = 'Sidebar + tab bar';

export default function VariantB({ children }: { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const isAdmin = props.auth.permissions.includes('users.manage');
    const email = props.auth.user?.email;
    const [collapsed, toggle] = useCollapsed();

    const row = (current: boolean) =>
        `flex h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] font-bold ${
            current ? 'bg-segment text-segment-foreground' : 'text-foreground hover:bg-surface-secondary'
        }`;

    // Tab bar: Home, Rounds | + | Trends, Practice. Practice Grounds and Admin live behind the avatar.
    const tabs = [golferNav[0], golferNav[1], golferNav[2], golferNav[3]];

    return (
        <div className="min-h-screen bg-background text-foreground md:flex">
            <aside
                className={`sticky top-0 hidden h-screen shrink-0 flex-col gap-1 bg-surface p-4 transition-[width] duration-200 md:flex ${
                    collapsed ? 'w-[76px]' : 'w-64'
                }`}
            >
                <div className={`mb-6 flex items-center pt-2 ${collapsed ? 'flex-col gap-4' : 'justify-between px-2'}`}>
                    <Wordmark size="lg" markOnly={collapsed} />
                    <button
                        type="button"
                        onClick={toggle}
                        className="flex size-8 items-center justify-center rounded-[12px] text-muted hover:bg-surface-secondary hover:text-foreground"
                        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                        title={collapsed ? 'Expand menu ([)' : 'Collapse menu ([)'}
                    >
                        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
                    </button>
                </div>
                {collapsed ? (
                    <Link
                        href="/rounds/create"
                        title="Enter a Round"
                        aria-label="Enter a Round"
                        className="mb-6 flex h-11 items-center justify-center rounded-[12px] bg-accent text-accent-foreground"
                    >
                        <Plus className="size-5" />
                    </Link>
                ) : (
                    <EnterRoundButton className="mb-6 h-12" />
                )}
                {golferNav.map((item) => (
                    <NavLink
                        key={item.label}
                        item={item}
                        title={collapsed ? item.label : undefined}
                        className={`${row(isCurrent(item, url))} ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                        <item.icon className="size-5 shrink-0" />
                        {!collapsed && item.label}
                    </NavLink>
                ))}
                {isAdmin && (
                    <>
                        {collapsed ? (
                            <hr className="mx-2 my-4 border-separator" />
                        ) : (
                            <p className="mt-6 mb-1 px-3 text-[11px] font-extrabold tracking-widest text-muted uppercase">
                                {adminPill.label}
                            </p>
                        )}
                        {adminNav.map((item) => (
                            <NavLink
                                key={item.label}
                                item={item}
                                title={collapsed ? `Admin: ${item.label}` : undefined}
                                className={`flex h-10 items-center gap-3 rounded-[12px] px-3 text-[13px] font-bold ${
                                    collapsed ? 'justify-center px-0' : ''
                                } ${
                                    isCurrent(item, url)
                                        ? 'bg-highlight text-highlight-foreground'
                                        : 'hover:bg-surface-secondary'
                                }`}
                            >
                                <item.icon className="size-4 shrink-0" />
                                {!collapsed && item.label}
                            </NavLink>
                        ))}
                    </>
                )}
                <div
                    className={`mt-auto flex items-center gap-3 rounded-[18px] ${
                        collapsed ? 'justify-center' : 'bg-surface-secondary p-2'
                    }`}
                >
                    <AvatarMenu email={email} align="up" />
                    {!collapsed && <span className="truncate text-[13px] text-muted">{email}</span>}
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                {/* Phone-width top row: wordmark + page title + avatar (holds Practice Grounds / Admin). */}
                <header className="flex items-center gap-3 px-4 py-3 md:hidden">
                    <Wordmark />
                    <span className="text-muted">/</span>
                    <span className="font-bold">{pageTitle(url)}</span>
                    <div className="ml-auto">
                        <AvatarMenu email={email} links={isAdmin ? [golferNav[4], adminPill] : [golferNav[4]]} />
                    </div>
                </header>
                {/* Desktop: a page header strip instead of a top bar. */}
                <header className="hidden items-end justify-between px-7 pt-8 pb-4 md:flex">
                    <h1 className="font-serif text-[46px] leading-none">{pageTitle(url)}</h1>
                </header>
                {isAdmin && url.startsWith('/admin') && (
                    <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
                        {adminNav.map((item) => (
                            <NavLink
                                key={item.label}
                                item={item}
                                className={`flex h-[34px] items-center rounded-[12px] px-3 text-[13px] font-bold ${
                                    isCurrent(item, url) ? 'bg-highlight text-highlight-foreground' : 'bg-surface'
                                }`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                )}
                <main className="px-4 pb-40 md:px-7 md:pb-28">{children}</main>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-separator bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden">
                {tabs.slice(0, 2).map((item) => (
                    <Tab key={item.label} item={item} current={isCurrent(item, url)} />
                ))}
                <Link
                    href="/rounds/create"
                    aria-label="Enter a Round"
                    className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground [box-shadow:var(--overlay-shadow)]"
                >
                    <Plus className="size-6" />
                </Link>
                {tabs.slice(2).map((item) => (
                    <Tab key={item.label} item={item} current={isCurrent(item, url)} />
                ))}
            </nav>
        </div>
    );
}

const COLLAPSED_KEY = 'prototype-shell-b-collapsed';

/** Collapsed state, remembered per browser. `[` toggles it, like many editors. */
function useCollapsed(): [boolean, () => void] {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(COLLAPSED_KEY) === '1';
        } catch {
            return false;
        }
    });
    const toggle = () =>
        setCollapsed((c) => {
            try {
                localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1');
            } catch {
                /* prototype: ignore */
            }
            return !c;
        });
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            if (el && (el.matches('input, textarea, select') || el.isContentEditable)) return;
            if (e.key === '[') toggle();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    return [collapsed, toggle];
}

function Tab({ item, current }: { item: (typeof golferNav)[number]; current: boolean }) {
    return (
        <NavLink
            item={item}
            className={`flex w-16 flex-col items-center gap-1 text-[11px] font-extrabold ${
                current ? 'text-foreground' : 'text-muted'
            }`}
        >
            <span className={`flex h-8 w-12 items-center justify-center rounded-full ${current ? 'bg-segment text-segment-foreground' : ''}`}>
                <item.icon className="size-5" />
            </span>
            {item.label}
        </NavLink>
    );
}
