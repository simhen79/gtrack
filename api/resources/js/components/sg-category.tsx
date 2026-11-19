import { SG_CATEGORIES } from '@gtrack/design';

export type SgCategoryKey = (typeof SG_CATEGORIES)[number]['key'];

/** Literal so Tailwind generates them. */
const BACKGROUND: Record<SgCategoryKey, string> = {
    ott: 'bg-cat-ott',
    app: 'bg-cat-app',
    shg: 'bg-cat-shg',
    put: 'bg-cat-put',
};

/** An SG Category's badge: its code on its colour, and its name when `long`. */
export function SgCategoryBadge({ category, long = false }: { category: SgCategoryKey; long?: boolean }) {
    const { code, name } = SG_CATEGORIES.find(({ key }) => key === category)!;

    return (
        <span
            className={`inline-flex w-max shrink-0 items-center gap-1.5 rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold text-cat-foreground ${BACKGROUND[category]}`}
        >
            {code}
            {long && <span className="font-bold">{name}</span>}
        </span>
    );
}
