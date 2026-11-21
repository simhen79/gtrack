import { Card } from '@heroui/react';
import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Wordmark } from '../components/wordmark';

/**
 * The pages before sign-in, outside the shell: the wordmark, the page's Instrument Serif title and
 * one card, in a column centred on the page.
 */
export function SignInLayout({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
    return (
        <main className="flex min-h-screen justify-center px-4 py-8 md:items-center md:py-16">
            <Head title={title} />
            <div className="flex w-full max-w-md flex-col gap-8 md:gap-10">
                <Wordmark />
                <div className="flex flex-col gap-3">
                    <h1 className="font-serif text-[34px] leading-none font-normal md:text-[46px]">{title}</h1>
                    <p className="text-[15px] font-medium text-muted">{description}</p>
                </div>
                <Card className="gap-5 p-6">{children}</Card>
            </div>
        </main>
    );
}
