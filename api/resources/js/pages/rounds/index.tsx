import { Button, buttonVariants, Link } from '@heroui/react';
import type { RoundStatsData, RoundSummaryData, SgBandData } from '@gtrack/types';
import { Head } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { DeleteRound } from '../../components/delete-round';
import { SgCategoryBadge, type SgCategoryKey } from '../../components/sg-category';
import { SgValue } from '../../components/sg-value';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';
import { displaySg } from '../../lib/strokes-gained';

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
export default function Rounds({ rounds, sg_bands }: { rounds: RoundSummaryData[]; sg_bands: SgBandData[] }) {
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
            <h2 className="sticky top-0 z-10 bg-surface px-4 pt-3 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">{month}</h2>
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
                                <RoundLine round={round} selected={round.id === selected.id} />
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
                        <RoundDetail round={selected} sgBands={sg_bands} />
                    </div>
                </div>
            ) : (
                <div className="flex max-w-md flex-col gap-2 rounded-[24px] bg-surface p-3">{list}</div>
            )}
        </>
    );
}

Rounds.layout = { title: 'Rounds' } satisfies ShellProps;

function RoundLine({ round, selected = false }: { round: RoundSummaryData; selected?: boolean }) {
    return (
        <>
            <span>
                <span className="block font-bold">{round.course_name}</span>
                <span className="text-[13px] opacity-70">
                    {shortDate(round.played_on)} · {round.holes} holes · {round.score} · vs {round.baseline}
                </span>
            </span>
            {/* Mint and coral are too faint on segment, so the selected Round's total takes its text colour. */}
            {selected ? (
                <span className="text-[16px] font-extrabold tabular-nums">{displaySg(round.sg_total)}</span>
            ) : (
                <SgValue value={round.sg_total} className="text-[16px]" />
            )}
        </>
    );
}

function RoundDetail({ round, sgBands }: { round: RoundSummaryData; sgBands: SgBandData[] }) {
    return (
        <div className="flex max-w-4xl flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[13px] text-muted">
                        {shortDate(round.played_on)} · {round.holes} holes
                    </p>
                    <h2 className="text-[28px] font-extrabold">{round.course_name}</h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <SgValue value={round.sg_total} className="text-[48px] leading-none" />
                    <dl className="flex gap-4 text-right">
                        <div>
                            <dt className="text-[13px] font-bold text-muted">Score</dt>
                            <dd className="text-[16px] font-extrabold tabular-nums">{round.score}</dd>
                        </div>
                        <div>
                            <dt className="text-[13px] font-bold text-muted">Baseline</dt>
                            <dd className="text-[16px] font-bold">{round.baseline}</dd>
                        </div>
                    </dl>
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

            <AdvancedDetail stats={round.stats} bands={round.bands} sgBands={sgBands} />

            <div className="flex gap-2">
                <Link href={`/rounds/${round.id}/edit`} className={buttonVariants({ variant: 'secondary', className: 'no-underline hover:no-underline' })}>
                    Edit Round
                </Link>
                <DeleteRound round={round} />
            </div>
        </div>
    );
}

function Tile({ children }: { children: ReactNode }) {
    return <div className="rounded-[18px] bg-surface-secondary p-4">{children}</div>;
}

type Stat = [label: string, value: string];

/** A Round's advanced stats, one tile per SG Category that has any. Only what was entered is shown. */
function AdvancedDetail({ stats, bands, sgBands }: { stats: RoundStatsData; bands: Record<string, string>; sgBands: SgBandData[] }) {
    const percent = (label: string, value: number | null): Stat[] => (value === null ? [] : [[label, `${value}%`]]);
    const bandsOf = (category: SgBandData['sg_category']): Stat[] =>
        sgBands.filter((band) => band.sg_category === category && bands[band.id] !== undefined).map((band) => [band.label, bands[band.id]]);

    const groups: { key: SgCategoryKey; stats: Stat[]; bands: Stat[] }[] = [
        {
            key: 'ott',
            stats: [
                ...percent('Fairways hit', stats.fairways_hit_percent),
                ...percent('Missed left', stats.fairways_missed_left_percent),
                ...percent('Missed right', stats.fairways_missed_right_percent),
                ...(stats.penalties === null ? [] : [['Penalties', String(stats.penalties)] as Stat]),
            ],
            bands: [],
        },
        {
            key: 'app',
            stats: (['long', 'short', 'left', 'right'] as const).flatMap((side) => percent(`Missed ${side}`, stats[`approach_miss_${side}_percent`])),
            bands: bandsOf('approach'),
        },
        {
            key: 'shg',
            stats: [...percent('Up and downs', stats.up_and_downs_percent), ...percent('Sand saves', stats.sand_saves_percent)],
            bands: [],
        },
        { key: 'put', stats: [], bands: bandsOf('putting') },
    ];
    const entered = groups.filter((group) => group.stats.length > 0 || group.bands.length > 0);

    if (entered.length === 0) {
        return null;
    }

    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-[18px] font-extrabold">Advanced stats</h3>
            {entered.map((group) => (
                <Tile key={group.key}>
                    <SgCategoryBadge category={group.key} long />
                    {group.stats.length > 0 && (
                        <dl className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
                            {group.stats.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-[13px] font-bold text-muted">{label}</dt>
                                    <dd className="text-[20px] font-extrabold tabular-nums">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {group.bands.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                            <p className="text-[13px] font-bold text-muted">Strokes Gained by distance</p>
                            <dl className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                                {group.bands.map(([label, value]) => (
                                    <div key={label} className="rounded-[12px] bg-surface px-3 py-2">
                                        <dt className="text-[11px] font-bold text-muted">{label}</dt>
                                        <dd>
                                            <SgValue value={value} className="text-[16px]" />
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </Tile>
            ))}
        </section>
    );
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
