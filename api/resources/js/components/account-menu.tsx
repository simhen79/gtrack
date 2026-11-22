import { ArrowRightFromSquare, Gear } from '@gravity-ui/icons';
import { Avatar, Dropdown, Header, Separator, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { router } from '@inertiajs/react';
import type { NavItem } from '../layouts/nav';
import { setThemeChoice, useThemeChoice, type ThemeChoice } from '../lib/theme';

const THEMES: { id: ThemeChoice; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
];

const SIGN_OUT = 'sign-out';

type Props = {
    email: string;
    /** Shows the email beside the avatar, as the expanded sidebar does. */
    showEmail?: boolean;
    /** The golfer's pages that aren't tabs, where the layout has no other place for them (phone width). */
    pages?: NavItem[];
    /** The Admin pages, where the layout has no other place for them (phone width). */
    admin?: NavItem[];
    placement?: 'top start' | 'bottom end';
};

/** The avatar and its menu: the email, the theme choice, any extra pages, Settings and Sign out. */
export function AccountMenu({ email, showEmail = false, pages = [], admin = [], placement = 'bottom end' }: Props) {
    return (
        <Dropdown>
            <Dropdown.Trigger
                aria-label="Account"
                className="flex min-w-0 items-center gap-3 rounded-[18px] text-left data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus"
            >
                <Avatar size="sm" className="shrink-0 bg-highlight">
                    <Avatar.Fallback className="bg-highlight text-sm font-extrabold text-highlight-foreground">
                        {email.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                </Avatar>
                {showEmail && <span className="truncate text-[13px] text-muted">{email}</span>}
            </Dropdown.Trigger>
            <Dropdown.Popover placement={placement} className="w-64 rounded-[18px] p-1.5">
                <p className="truncate px-3 py-2 text-[13px] text-muted">{email}</p>
                <ToggleButtonGroup
                    aria-label="Theme"
                    selectionMode="single"
                    disallowEmptySelection
                    fullWidth
                    className="mb-1 rounded-[14px] bg-surface-secondary p-1"
                    selectedKeys={[useThemeChoice()]}
                    onSelectionChange={(keys) => setThemeChoice([...keys][0] as ThemeChoice)}
                >
                    {THEMES.map(({ id, label }) => (
                        <ToggleButton
                            key={id}
                            id={id}
                            className="h-8 rounded-[10px] bg-transparent text-[13px] font-bold data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground"
                        >
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <Dropdown.Menu
                    aria-label="Account"
                    onAction={(key) => {
                        if (key === SIGN_OUT) {
                            router.post('/logout');
                        }
                    }}
                >
                    {pages.map((item) => (
                        <Dropdown.Item key={item.href} id={item.href} href={item.href} textValue={item.label}>
                            <item.icon className="size-4" />
                            {item.label}
                        </Dropdown.Item>
                    ))}
                    {pages.length > 0 && <Separator />}
                    {admin.length > 0 && (
                        <Dropdown.Section>
                            <Header className="px-3 pt-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">
                                Admin
                            </Header>
                            {admin.map((item) => (
                                <Dropdown.Item key={item.href} id={item.href} href={item.href} textValue={item.label}>
                                    <item.icon className="size-4" />
                                    {item.label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Section>
                    )}
                    {admin.length > 0 && <Separator />}
                    <Dropdown.Item id="/settings" href="/settings" textValue="Settings">
                        <Gear className="size-4" />
                        Settings
                    </Dropdown.Item>
                    <Dropdown.Item id={SIGN_OUT} textValue="Sign out" variant="danger" className="text-danger">
                        <ArrowRightFromSquare className="size-4" />
                        Sign out
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
}
