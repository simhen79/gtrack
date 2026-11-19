import { BookOpen, House, ListUl, Persons } from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    /** Other paths that belong to this page, such as its editors. */
    within?: string[];
};

/**
 * The golfer's pages, in sidebar order. A slice adds its page here when the page lands:
 * Trends and Practice become tabs too, Practice Grounds stays in the avatar menu at phone width.
 */
export const golferNav: (NavItem & { tab: boolean })[] = [
    { label: 'Home', href: '/', icon: House, tab: true },
    { label: 'Rounds', href: '/rounds', icon: ListUl, tab: true },
];

/** Pages under Admin, each shown to whoever has its permission. */
export const adminNav: (NavItem & { permission: string })[] = [
    { label: 'Users', href: '/admin/users', icon: Persons, permission: 'users.manage' },
    { label: 'Catalogue', href: '/admin/catalogue', icon: BookOpen, permission: 'catalogue.write', within: ['/admin/drills'] },
];

/** The admin pages this golfer's permissions open, or none for a golfer who isn't an admin. */
export function adminPagesFor(permissions: string[]): NavItem[] {
    return adminNav.filter((item) => permissions.includes(item.permission));
}

export const ENTER_A_ROUND = '/rounds/create';

export function isCurrent(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];
    const under = (href: string) => path === href || path.startsWith(`${href}/`);
    return item.href === '/' ? path === '/' : [item.href, ...(item.within ?? [])].some(under);
}
