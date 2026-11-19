import { House, ListUl, Persons } from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * The golfer's pages, in sidebar order. A slice adds its page here when the page lands:
 * Trends and Practice become tabs too, Practice Grounds stays in the avatar menu at phone width.
 */
export const golferNav: (NavItem & { tab: boolean })[] = [
    { label: 'Home', href: '/', icon: House, tab: true },
    { label: 'Rounds', href: '/rounds', icon: ListUl, tab: true },
];

/** Pages under Admin, for golfers with `users.manage`. */
export const adminNav: NavItem[] = [{ label: 'Users', href: '/admin/users', icon: Persons }];

export const ENTER_A_ROUND = '/rounds/create';

export function isCurrent(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];
    return item.href === '/' ? path === '/' : path === item.href || path.startsWith(`${item.href}/`);
}
