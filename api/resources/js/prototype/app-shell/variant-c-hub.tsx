// PROTOTYPE (#51 app shell) — Variant C: "Hub + launcher".
// No persistent nav. Every width gets the same top row the phone app uses: menu button,
// wordmark, Enter a Round, avatar. Below it, breadcrumbs say where you are.
// The menu button opens a full-screen launcher of big tiles (golfer pages, then Admin).
// Bet: one shell for web, phone-width web and the phone app; the page gets all the room.

import { ChevronRight, LayoutCellsLarge, Xmark } from '@gravity-ui/icons';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { SharedProps } from '../../types';
import { adminNav, golferNav, isCurrent, pageTitle, type NavItem } from './nav';
import { AvatarMenu, EnterRoundButton, NavLink, Wordmark } from './parts';

export const name = 'Hub + launcher';

export default function VariantC({ children }: { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const isAdmin = props.auth.permissions.includes('users.manage');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((o) => !o);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const path = url.split('?')[0];
    const crumbs: { label: string; href?: string }[] = path === '/' ? [] : [{ label: 'Home', href: '/' }];
    if (path.startsWith('/rounds/')) crumbs.push({ label: 'Rounds', href: '/rounds' });
    if (path.startsWith('/admin')) crumbs.push({ label: 'Admin' });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex items-center gap-3 px-4 py-4 md:px-7">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex h-10 items-center gap-2 rounded-[12px] bg-surface px-3 font-bold"
                    aria-label="Open launcher"
                >
                    <LayoutCellsLarge className="size-5" />
                    <span className="hidden text-[13px] text-muted md:inline">⌘K</span>
                </button>
                <Wordmark />
                <div className="ml-auto flex items-center gap-2">
                    <EnterRoundButton compact className="sm:hidden" />
                    <EnterRoundButton className="hidden sm:inline-flex" />
                    <AvatarMenu email={props.auth.user?.email} />
                </div>
            </header>

            <div className="px-4 pt-2 pb-6 md:px-7">
                {crumbs.length > 0 && (
                    <p className="mb-2 flex items-center gap-1 text-[13px] text-muted">
                        {crumbs.map((c) => (
                            <span key={c.label} className="flex items-center gap-1">
                                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
                                <ChevronRight className="size-3" />
                            </span>
                        ))}
                    </p>
                )}
                <h1 className="font-serif text-[34px] leading-none md:text-[46px]">{pageTitle(url)}</h1>
            </div>

            <main className="px-4 pb-28 md:px-7">{children}</main>

            {open && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 backdrop-blur md:p-10">
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-8 flex items-center justify-between">
                            <Wordmark size="lg" />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex size-10 items-center justify-center rounded-[12px] bg-surface"
                                aria-label="Close"
                            >
                                <Xmark className="size-5" />
                            </button>
                        </div>
                        <Tiles items={golferNav} url={url} onNavigate={() => setOpen(false)} />
                        {isAdmin && (
                            <>
                                <p className="mt-8 mb-3 text-[11px] font-extrabold tracking-widest text-muted uppercase">
                                    Admin
                                </p>
                                <Tiles items={adminNav} url={url} onNavigate={() => setOpen(false)} small />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Tiles({
    items,
    url,
    onNavigate,
    small = false,
}: {
    items: NavItem[];
    url: string;
    onNavigate: () => void;
    small?: boolean;
}) {
    return (
        <div className={`grid gap-4 ${small ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
            {items.map((item) => {
                const current = isCurrent(item, url);
                return (
                    <NavLink
                        key={item.label}
                        item={item}
                        onNavigate={onNavigate}
                        className={`flex flex-col justify-between rounded-[24px] p-5 ${small ? 'h-28' : 'h-36 md:h-44'} ${
                            current ? 'bg-segment text-segment-foreground' : 'bg-surface hover:bg-surface-secondary'
                        }`}
                    >
                        <item.icon className={small ? 'size-5' : 'size-7'} />
                        <span className={`font-extrabold ${small ? 'text-[15px]' : 'text-xl'}`}>{item.label}</span>
                    </NavLink>
                );
            })}
        </div>
    );
}
