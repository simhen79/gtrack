import { ChevronsLeft, ChevronsRight, Plus } from '@gravity-ui/icons';
import { Button, buttonVariants, Link, Tooltip } from '@heroui/react';
import { usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import { AccountMenu } from '../components/account-menu';
import { Wordmark } from '../components/wordmark';
import type { SharedProps } from '../types';
import { adminPagesFor, ENTER_A_ROUND, golferNav, isCurrent, type NavItem } from './nav';

/**
 * What a page tells the shell, through its `layout`. `action` is the page's create action,
 * such as Add a Drill: the shell puts it at the top right, on the title's line.
 */
export type ShellProps = { title: string; action?: PageAction };

export type PageAction = { label: string; href: string };

/**
 * Every signed-in page sits in this persistent layout: a sidebar where there's room, which
 * collapses to an icon rail, and at phone width a top row over a bottom tab bar.
 */
export default function AppShell({ title, action, children }: ShellProps & { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const email = props.auth.user?.email ?? '';
    const adminPages = adminPagesFor(props.auth.permissions);
    const [collapsed, toggleCollapsed] = useCollapsed();

    return (
        <div className="min-h-screen md:flex">
            <aside
                className={`sticky top-0 hidden h-screen shrink-0 flex-col gap-1 overflow-y-auto bg-surface p-4 md:flex ${
                    collapsed ? 'w-[76px] items-stretch' : 'w-64'
                }`}
            >
                <div className={`mb-6 flex items-center pt-2 ${collapsed ? 'flex-col gap-4' : 'justify-between px-2'}`}>
                    <Wordmark markOnly={collapsed} />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-keyshortcuts="["
                        onPress={toggleCollapsed}
                    >
                        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
                    </Button>
                </div>

                <RailTooltip label="Enter a Round" collapsed={collapsed}>
                    <Link
                        href={ENTER_A_ROUND}
                        aria-label={collapsed ? 'Enter a Round' : undefined}
                        className={buttonVariants({
                            variant: 'primary',
                            fullWidth: true,
                            className: 'mb-6 h-12 text-[15px] font-bold no-underline hover:no-underline',
                        })}
                    >
                        {collapsed ? <Plus className="size-5" /> : 'Enter a Round'}
                    </Link>
                </RailTooltip>

                <nav aria-label="Pages" className="flex flex-col gap-1">
                    {golferNav.map((item) => (
                        <SidebarLink key={item.href} item={item} url={url} collapsed={collapsed} />
                    ))}
                </nav>

                {adminPages.length > 0 && (
                    <nav aria-label="Admin" className="flex flex-col gap-1">
                        {collapsed ? (
                            <hr className="mx-2 my-4 border-separator" />
                        ) : (
                            <p className="mt-6 mb-1 px-3 text-[11px] font-extrabold tracking-widest text-muted uppercase">
                                Admin
                            </p>
                        )}
                        {adminPages.map((item) => (
                            <SidebarLink key={item.href} item={item} url={url} collapsed={collapsed} admin />
                        ))}
                    </nav>
                )}

                <div className={`mt-auto flex ${collapsed ? 'justify-center' : 'rounded-[18px] bg-surface-secondary p-2'}`}>
                    <AccountMenu email={email} showEmail={!collapsed} placement="top start" />
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                <header className="flex items-center gap-3 px-4 py-3 md:hidden">
                    <Wordmark />
                    <span className="text-muted" aria-hidden>
                        /
                    </span>
                    <h1 className="truncate font-bold">{title}</h1>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                        {action && <PageActionLink action={action} size="sm" />}
                        <AccountMenu email={email} admin={adminPages} />
                    </div>
                </header>
                <header className="hidden items-end justify-between gap-4 px-7 pt-8 pb-4 md:flex">
                    <h1 className="font-serif text-[46px] leading-none font-normal">{title}</h1>
                    {action && <PageActionLink action={action} />}
                </header>
                <main className="px-4 pb-32 md:px-7 md:pb-12">{children}</main>
            </div>

            <TabBar url={url} />
        </div>
    );
}

/** A page's create action, top right: secondary, because Enter a Round is the view's one accent button. */
function PageActionLink({ action, size = 'md' }: { action: PageAction; size?: 'sm' | 'md' }) {
    return (
        <Link href={action.href} className={buttonVariants({ variant: 'secondary', size, className: 'gap-1.5 bg-surface no-underline hover:no-underline' })}>
            <Plus className="size-4" />
            {action.label}
        </Link>
    );
}

function SidebarLink({ item, url, collapsed, admin = false }: { item: NavItem; url: string; collapsed: boolean; admin?: boolean }) {
    const current = isCurrent(item, url);
    // The current page is segment white; the current admin page is highlight lime.
    const tone = current
        ? admin
            ? 'bg-highlight text-highlight-foreground'
            : 'bg-segment text-segment-foreground'
        : 'text-foreground hover:bg-surface-secondary';

    return (
        <RailTooltip label={admin ? `Admin: ${item.label}` : item.label} collapsed={collapsed}>
            <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 font-bold no-underline hover:no-underline ${
                    admin ? 'h-10 text-[13px]' : 'h-11 text-[15px]'
                } ${collapsed ? 'justify-center px-0' : ''} ${tone}`}
            >
                <item.icon className={`shrink-0 ${admin ? 'size-4' : 'size-5'}`} />
                {!collapsed && item.label}
            </Link>
        </RailTooltip>
    );
}

/** Page names for the icon rail; the expanded sidebar shows them already. */
function RailTooltip({ label, collapsed, children }: { label: string; collapsed: boolean; children: ReactNode }) {
    if (!collapsed) {
        return children;
    }
    return (
        <Tooltip delay={0} closeDelay={0}>
            {children}
            <Tooltip.Content
                placement="right"
                className="rounded-[8px] bg-segment px-2 py-1 text-[13px] font-extrabold text-segment-foreground"
            >
                {label}
            </Tooltip.Content>
        </Tooltip>
    );
}

/** Phone width: the pages that are tabs, with Enter a Round as the raised centre button. */
function TabBar({ url }: { url: string }) {
    const tabs = golferNav.filter((item) => item.tab);
    // Half the tabs either side of the centre button, so it stays centred however many there are.
    const left = Math.ceil(tabs.length / 2);

    return (
        <nav
            aria-label="Pages"
            style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
            className="fixed inset-x-0 bottom-0 z-30 grid items-end border-t border-separator bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
        >
            {tabs.slice(0, left).map((item) => (
                <Tab key={item.href} item={item} current={isCurrent(item, url)} />
            ))}
            <Link
                href={ENTER_A_ROUND}
                aria-label="Enter a Round"
                className="-mt-6 flex size-14 items-center justify-center justify-self-center rounded-full bg-accent text-accent-foreground no-underline [box-shadow:var(--overlay-shadow)] hover:no-underline"
            >
                <Plus className="size-6" />
            </Link>
            {tabs.slice(left).map((item) => (
                <Tab key={item.href} item={item} current={isCurrent(item, url)} />
            ))}
        </nav>
    );
}

function Tab({ item, current }: { item: NavItem; current: boolean }) {
    return (
        <Link
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={`flex w-full flex-col items-center gap-1 text-[11px] font-extrabold no-underline hover:no-underline ${
                current ? 'text-foreground' : 'text-muted'
            }`}
        >
            <span
                className={`flex h-8 w-12 items-center justify-center rounded-full ${
                    current ? 'bg-segment text-segment-foreground' : ''
                }`}
            >
                <item.icon className="size-5" />
            </span>
            {item.label}
        </Link>
    );
}

const COLLAPSED_KEY = 'gtrack.sidebar-collapsed';

/** The sidebar's icon-rail state, remembered in this browser. `[` toggles it outside text fields, while the sidebar shows. */
function useCollapsed(): [boolean, () => void] {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(COLLAPSED_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
        } catch {
            // Storage can be off (private browsing): the rail still toggles, it just isn't remembered.
        }
    }, [collapsed]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
            const modified = event.metaKey || event.ctrlKey || event.altKey;
            // Below md the sidebar is hidden, so `[` would change it unseen.
            const sidebarShows = window.matchMedia('(min-width: 48rem)').matches;
            if (event.key === '[' && !typing && !modified && !event.repeat && !event.defaultPrevented && sidebarShows) {
                setCollapsed((was) => !was);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return [collapsed, () => setCollapsed((was) => !was)];
}
