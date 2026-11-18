// PROTOTYPE (#51 app shell) — Variant A: "Top bar".
// The design system's shell as written: wordmark, nav pills, search, Enter a Round, avatar.
// Admin pages get a second row of lime sub-nav pills. At phone width the pills fold into
// a menu button that opens a left drawer.

import { Bars, Magnifier, Xmark } from '@gravity-ui/icons';
import { usePage } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import type { SharedProps } from '../../types';
import { adminNav, adminPill, golferNav, isCurrent } from './nav';
import { AvatarMenu, EnterRoundButton, NavLink, Wordmark } from './parts';

export const name = 'Top bar';

export default function VariantA({ children }: { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const isAdmin = props.auth.permissions.includes('users.manage');
    const onAdminPage = url.startsWith('/admin');
    const nav = isAdmin ? [...golferNav, adminPill] : golferNav;
    const [drawer, setDrawer] = useState(false);

    const pill = (current: boolean) =>
        `flex h-10 items-center rounded-[12px] px-4 text-[15px] font-bold whitespace-nowrap ${
            current ? 'bg-segment text-segment-foreground' : 'bg-surface text-foreground hover:bg-surface-secondary'
        }`;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex items-center gap-3 px-4 py-4 md:px-7">
                <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-[12px] bg-surface lg:hidden"
                    onClick={() => setDrawer(true)}
                    aria-label="Menu"
                >
                    <Bars className="size-5" />
                </button>
                <Wordmark />
                <nav className="ml-4 hidden items-center gap-2 lg:flex">
                    {nav.map((item) => (
                        <NavLink key={item.label} item={item} className={pill(isCurrent(item, url))}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden h-10 w-56 items-center gap-2 rounded-[12px] bg-surface px-3 text-muted xl:flex">
                        <Magnifier className="size-4" /> <span className="text-[13px]">Search</span>
                    </div>
                    <EnterRoundButton className="hidden sm:inline-flex" />
                    <AvatarMenu email={props.auth.user?.email} />
                </div>
            </header>

            {isAdmin && onAdminPage && (
                <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:px-7">
                    {adminNav.map((item) => (
                        <NavLink
                            key={item.label}
                            item={item}
                            className={`flex h-[34px] items-center rounded-[12px] border px-3 text-[13px] font-bold ${
                                isCurrent(item, url)
                                    ? 'border-transparent bg-highlight text-highlight-foreground'
                                    : 'border-border'
                            }`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            )}

            <main className="px-4 pb-28 md:px-7">{children}</main>

            {drawer && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-[var(--backdrop)]" onClick={() => setDrawer(false)} />
                    <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col gap-2 bg-overlay p-4 [box-shadow:var(--overlay-shadow)]">
                        <div className="mb-4 flex items-center justify-between">
                            <Wordmark />
                            <button type="button" onClick={() => setDrawer(false)} aria-label="Close">
                                <Xmark className="size-5" />
                            </button>
                        </div>
                        {nav.map((item) => (
                            <NavLink
                                key={item.label}
                                item={item}
                                onNavigate={() => setDrawer(false)}
                                className={`${pill(isCurrent(item, url))} h-12`}
                            >
                                <item.icon className="mr-3 size-5" />
                                {item.label}
                            </NavLink>
                        ))}
                        <EnterRoundButton className="mt-auto h-12 sm:hidden" />
                    </div>
                </div>
            )}
        </div>
    );
}
