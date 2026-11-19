import { Button, buttonVariants, Link } from '@heroui/react';
import type { RoundStatsData, RoundSummaryData } from '@gtrack/types';
import { Head, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { SgCategoryBadge, type SgCategoryKey } from '../../components/sg-category';
import { SgValue } from '../../components/sg-value';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';

const SG_CATEGORIES: { field: 'sg_off_the_tee' | 'sg_approach' | 'sg_short_game' | 'sg_putting'; key: SgCategoryKey }[] = [
    { field: 'sg_off_the_tee', key: 'ott' },
    { field: 'sg_approach', key: 'app' },
    { field: 'sg_short_game', key: 'shg' },
    { field: 'sg_putting', key: 'put' },
];

/** From here the list sits beside the selected Round's detail. */
const WIDE = '(min-width: 64rem)';

/**
 * The golfer's Rounds, newest first and grouped by month. At desktop width, the list
 * sits beside the selected Round; narrower, a Round opens straight into editing.
 */
export default function Rounds({ rounds }: { rounds: RoundSummaryData[] }) {
    const wide = useMediaQuery(WIDE);
    const [selectedId, setSelectedId] = useState(rounds[0]?.id);
    const selected = rounds.find((round) => round.id === selectedId) ?? rounds[0];

    if (rounds.length === 0) {
        return (
            <>
                <Head title="Rounds" />
                <p className="text-muted">No Rounds yet. Enter your first to see where you lose strokes.</p>
            </>
        );
    }

    const list = byMonth(rounds).map(([month, monthRounds]) => (
        <section key={month} className="flex flex-col gap-1">
            <h2 className="sticky top-0 z-10 bg-surface px-4 pt-3 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">
                {month}
            </h2>
            <ul className="flex flex-col gap-1">
                {monthRounds.map((round) => (
                    <li key={round.id}>
                        {wide ? (
                            <button
                                type="button"
                                aria-current={round.id === selected.id}
                                onClick={() => setSelectedId(round.id)}
                                className={`flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left ${
                                    round.id === selected.id ? 'bg-segment text-segment-foreground' : 'hover:bg-surface-secondary'
                                }`}
                            >
                                <RoundLine round={round} />
                            </button>
                        ) : (
                            <Link
                                href={`/rounds/${round.id}/edit`}
                                className="flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-foreground no-underline hover:bg-surface-secondary hover:no-underline"
                            >
                                <RoundLine round={round} />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    ));

    return (
        <>
            <Head title="Rounds" />
            {wide ? (
                <div className="grid h-[calc(100vh-140px)] grid-cols-[360px_1fr] gap-4">
                    <div className="flex flex-col gap-2 overflow-y-auto rounded-[24px] bg-surface p-3">{list}</div>
                    <div className="overflow-y-auto rounded-[24px] bg-surface p-7">
                        <RoundDetail round={selected} />
                    </div>
                </div>
            ) : (
                <div className="flex max-w-md flex-col gap-2 rounded-[24px] bg-surface p-3">{list}</div>
            )}
        </>
    );
}

Rounds.layout = { title: 'Rounds' } satisfies ShellProps;

function RoundLine({ round }: { round: RoundSummaryData }) {
    return (
        <>
            <span>
                <span className="block font-bold">{round.course_name}</span>
                <span className="text-[13px] opacity-70">
                    {shortDate(round.played_on)} · {round.holes} holes · {round.score}
                </span>
            </span>
            <SgValue value={round.sg_total} className="text-[16px]" />
        </>
    );
}

function RoundDetail({ round }: { round: RoundSummaryData }) {
    const destroy = () => {
        if (window.confirm('Delete this Round? This can’t be undone.')) {
            router.delete(`/rounds/${round.id}`);
        }
    };
    const stats = statTiles(round.stats);

    return (
        <div className="flex max-w-4xl flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[13px] text-muted">
                        {shortDate(round.played_on)} · {round.holes} holes · vs {round.baseline}
                    </p>
                    <h2 className="text-[28px] font-extrabold">{round.course_name}</h2>
                </div>
                <div className="text-right">
                    <SgValue value={round.sg_total} className="text-[48px] leading-none" />
                    <p className="text-[13px] text-muted">Score {round.score}</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {SG_CATEGORIES.map(({ field, key }) => (
                    <Tile key={field}>
                        <SgCategoryBadge category={key} long />
                        <SgValue value={round[field]} className="mt-2 block text-[32px]" />
                    </Tile>
                ))}
            </div>

            {stats.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {stats.map(([label, value]) => (
                        <Tile key={label}>
                            <p className="text-[13px] font-bold text-muted">{label}</p>
                            <p className="text-[20px] font-extrabold tabular-nums">{value}</p>
                        </Tile>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <Link href={`/rounds/${round.id}/edit`} className={buttonVariants({ variant: 'secondary', className: 'no-underline hover:no-underline' })}>
                    Edit Round
                </Link>
                <Button variant="danger-soft" onPress={destroy}>
                    Delete Round
                </Button>
            </div>
        </div>
    );
}

function Tile({ children }: { children: ReactNode }) {
    return <div className="rounded-[18px] bg-surface-secondary p-4">{children}</div>;
}

/** The advanced stats worth a glance, each only when entered. */
function statTiles(stats: RoundStatsData): [string, string][] {
    const tiles: [string, string][] = [];
    const teeShots = [stats.fairways_hit, stats.fairways_missed_left, stats.fairways_missed_right];
    if (stats.fairways_hit !== null) {
        tiles.push(['Fairways', `${stats.fairways_hit} / ${teeShots.reduce<number>((sum, n) => sum + (n ?? 0), 0)}`]);
    }

    const misses = (['long', 'short', 'left', 'right'] as const)
        .map((side) => [side, stats[`approach_miss_${side}_percent`]] as const)
        .filter((miss): miss is readonly [typeof miss[0], number] => miss[1] !== null);
    if (misses.length > 0) {
        const [side, percent] = misses.reduce((most, miss) => (miss[1] > most[1] ? miss : most));
        tiles.push(['Approach miss', `${side[0].toUpperCase()}${side.slice(1)} ${percent}%`]);
    }

    if (stats.up_and_downs_attempted !== null) {
        tiles.push(['Up and downs', `${stats.up_and_downs_made ?? 0} / ${stats.up_and_downs_attempted}`]);
    }

    return tiles;
}

function byMonth(rounds: RoundSummaryData[]): [string, RoundSummaryData[]][] {
    const months = new Map<string, RoundSummaryData[]>();
    for (const round of rounds) {
        const month = new Date(`${round.played_on}T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        months.set(month, [...(months.get(month) ?? []), round]);
    }
    return [...months];
}

function shortDate(date: string): string {
    return new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
