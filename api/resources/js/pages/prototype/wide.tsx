// PROTOTYPE (#50): how should the web pages use a wide screen?
// Three layout systems — A Bento grid, B List + detail, C Focused column + side rail — each
// applied to Home, Enter a Round, Rounds, Trends and the Catalogue, inside the real app shell.
// Switch with ?variant=A|B|C and ?page=home|round|rounds|trends|catalogue, or the pink bar
// (← → cycle variants). Fake data, no mutations. Lives only on prototype/50-wide-screen.

import { router, setLayoutProps, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { PrototypeSwitcher } from '../../components/prototype-switcher';
import * as A from '../../prototype/wide/variant-a';
import * as B from '../../prototype/wide/variant-b';
import * as C from '../../prototype/wide/variant-c';
import * as D from '../../prototype/wide/variant-d';

const VARIANTS = { A, B, C, D };
const PAGES = [
    { key: 'home', name: 'Home' },
    { key: 'round', name: 'Enter a Round' },
    { key: 'rounds', name: 'Rounds' },
    { key: 'trends', name: 'Trends' },
    { key: 'catalogue', name: 'Catalogue' },
] as const;
type PageKey = (typeof PAGES)[number]['key'];

export default function WidePrototype() {
    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const variant = (params.get('variant') ?? 'A') as keyof typeof VARIANTS;
    const page = (params.get('page') ?? 'home') as PageKey;
    const V = VARIANTS[variant] ?? A;
    const Page = V.pages[page] ?? V.pages.home;

    useEffect(() => {
        setLayoutProps({ title: PAGES.find((p) => p.key === page)?.name ?? 'Home' });
    }, [page]);

    const go = (next: { variant?: string; page?: string }) =>
        router.get('/prototype/wide', { variant, page, ...next }, { preserveScroll: true, replace: true });

    return (
        <>
            <Page key={`${variant}-${page}`} />
            <PrototypeSwitcher
                variants={Object.entries(VARIANTS).map(([key, v]) => ({ key, name: v.name }))}
                current={variant}
                onChange={(key) => go({ variant: key })}
                pages={[...PAGES]}
                page={page}
                onPage={(key) => go({ page: key })}
            />
        </>
    );
}

WidePrototype.layout = { title: 'Home' };
