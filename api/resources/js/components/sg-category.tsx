import { SG_CATEGORIES } from '@gtrack/design';
import { Chip } from '@heroui/react';

export type SgCategoryKey = (typeof SG_CATEGORIES)[number]['key'];

/** Literal so Tailwind generates them. */
const BACKGROUND: Record<SgCategoryKey, string> = {
    ott: 'bg-cat-ott',
    app: 'bg-cat-app',
    shg: 'bg-cat-shg',
    put: 'bg-cat-put',
};

/** An SG Category's badge: its code on its colour, followed by its name when `long`. */
export function SgCategoryBadge({ category, long = false }: { category: SgCategoryKey; long?: boolean }) {
    const { code, name } = SG_CATEGORIES.find(({ key }) => key === category)!;
    const badge = (
        <Chip size="sm" className={`w-max shrink-0 px-1.5 text-[11px] font-extrabold text-cat-foreground ${BACKGROUND[category]}`}>
            {code}
        </Chip>
    );

    if (!long) {
        return badge;
    }

    return (
        <span className="inline-flex w-max shrink-0 items-center gap-2 text-[13px] font-bold">
            {badge}
            {name}
        </span>
    );
}
