import { Tabs } from '@heroui/react';
import { usePage } from '@inertiajs/react';
import { adminPagesFor, isCurrent } from '../layouts/nav';
import type { SharedProps } from '../types';

/** The admin sub-nav: a pill per admin page, each a link, so every page keeps its URL. */
export function AdminTabs() {
    const { url, props } = usePage<SharedProps>();
    const pages = adminPagesFor(props.auth.permissions);

    return (
        <Tabs selectedKey={pages.find((page) => isCurrent(page, url))?.href ?? ''} className="w-max">
            <Tabs.ListContainer>
                <Tabs.List aria-label="Admin pages">
                    {pages.map((page) => (
                        <Tabs.Tab key={page.href} id={page.href} href={page.href}>
                            {page.label}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs.ListContainer>
        </Tabs>
    );
}
