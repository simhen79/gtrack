import { Link } from '@heroui/react';

/** "gtrack" beside the ring-and-dot mark (accent ring, highlight dot), linking Home. No logo exists yet. */
export function Wordmark({ markOnly = false }: { markOnly?: boolean }) {
    return (
        <Link href="/" aria-label="gtrack, Home" className="flex items-center gap-2 text-foreground no-underline hover:no-underline">
            <span className="flex size-6 items-center justify-center rounded-full border-[5px] border-accent" aria-hidden>
                <span className="size-2 rounded-full bg-highlight" />
            </span>
            {!markOnly && <span className="text-xl font-extrabold tracking-tight">gtrack</span>}
        </Link>
    );
}
