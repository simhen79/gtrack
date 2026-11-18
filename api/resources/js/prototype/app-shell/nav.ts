// PROTOTYPE (#51 app shell) — throwaway. Lives on branch prototype/51-app-shell only.
// Nav data shared by the three shell variants. Pages that don't exist yet are listed
// with `href: null` so each variant shows how the full v1 nav fits, greyed out.

import { ChartLine, FileText, House, ListUl, MapPin, Persons, Book, Target, Shield } from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
    label: string;
    href: string | null;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const golferNav: NavItem[] = [
    { label: 'Home', href: '/', icon: House },
    { label: 'Rounds', href: '/rounds', icon: ListUl },
    { label: 'Trends', href: null, icon: ChartLine },
    { label: 'Practice', href: null, icon: Target },
    { label: 'Practice Grounds', href: null, icon: MapPin },
];

export const adminPill: NavItem = { label: 'Admin', href: '/admin/users', icon: Shield };

export const adminNav: NavItem[] = [
    { label: 'Users', href: '/admin/users', icon: Persons },
    { label: 'Catalogue', href: null, icon: Book },
    { label: 'Drafts', href: null, icon: FileText },
];

export function isCurrent(item: NavItem, url: string): boolean {
    if (item.href === null) return false;
    const path = url.split('?')[0];
    if (item.href === '/') return path === '/';
    if (item === adminPill) return path.startsWith('/admin');
    return path === item.href || path.startsWith(`${item.href}/`);
}

export function pageTitle(url: string): string {
    const path = url.split('?')[0];
    if (path === '/') return 'Home';
    if (path === '/rounds/create') return 'Enter a Round';
    if (path.startsWith('/rounds/')) return 'Edit Round';
    if (path.startsWith('/rounds')) return 'Rounds';
    if (path.startsWith('/admin/users')) return 'Users';
    if (path.startsWith('/settings')) return 'Handicap Index';
    return 'gtrack';
}

export function initials(email: string | undefined): string {
    return (email ?? '?').slice(0, 2).toUpperCase();
}
