import { formatSG, parseSG } from '@gtrack/design';
import type { SgTrendData, TrendRoundData } from '@gtrack/types';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { SgCategoryKey } from './sg-category';

/** Hovering one chart moves the marker on all four. */
const SYNC_ID = 'sg-trends';

type Point = { round: TrendRoundData; value: number };

type Props = {
    category: SgCategoryKey;
    trend: SgTrendData;
    /** The Rounds shown, oldest first, one per value in `trend.values`. */
    rounds: TrendRoundData[];
    /** Shared by the four charts, so heights compare across SG Categories. */
    domain: [number, number];
    height: number;
    /** Grid and y-axis labels, for charts with room for them. */
    axis?: boolean;
};

/**
 * One SG Category's value in each shown Round, a dot per Round joined by a line, against a dashed
 * Last 20 average and a zero line. Colours are CSS variables, so the chart follows the theme.
 */
export function TrendChart({ category, trend, rounds, domain, height, axis = false }: Props) {
    const last20 = trend.last_20 === null ? null : parseSG(trend.last_20);
    const points: Point[] = rounds.map((round, i) => ({
        round,
        value: parseSG(trend.values[i]) ?? 0,
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={points} syncId={SYNC_ID} margin={{ top: 8, right: 8, bottom: 8, left: axis ? 0 : 8 }}>
                {axis && <CartesianGrid vertical={false} stroke="var(--separator)" strokeDasharray="4 4" />}
                <XAxis dataKey={(point: Point) => point.round.id} hide />
                <YAxis
                    domain={domain}
                    ticks={ticks(domain)}
                    interval={0}
                    hide={!axis}
                    width={44}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    tickFormatter={(value: number) => formatSG(value)}
                />
                <ReferenceLine y={0} stroke="var(--muted)" strokeWidth={1.5} />
                <Tooltip content={TrendTooltip} offset={16} cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4' }} isAnimationActive={false} />
                {last20 !== null && <ReferenceLine y={last20} stroke="var(--chart-bar)" strokeWidth={2} strokeDasharray="5 4" />}
                <Line
                    dataKey="value"
                    name="Round"
                    stroke={`var(--cat-${category})`}
                    strokeWidth={3}
                    dot={{ r: axis ? 3 : 1.5, fill: `var(--cat-${category})`, stroke: 'none' }}
                    activeDot={{
                        r: 5,
                        fill: `var(--cat-${category})`,
                        stroke: 'var(--surface)',
                        strokeWidth: 3,
                    }}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

/** Every 2 strokes across the domain, through zero. */
function ticks([min, max]: [number, number]): number[] {
    const from = Math.ceil(min / 2) * 2;
    return Array.from({ length: Math.floor((max - from) / 2) + 1 }, (_, i) => from + i * 2);
}

/** The hovered Round: its value signed, then its date, course and score. */
function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
    const point = payload?.[0]?.payload as Point | undefined;
    if (!active || !point) {
        return null;
    }

    const played = new Date(`${point.round.played_on}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="rounded-[8px] bg-segment px-2 py-1 text-[13px] text-segment-foreground shadow-lg">
            <div className="font-extrabold tabular-nums">{formatSG(point.value)}</div>
            <div>{played}</div>
            <div>{point.round.course_name}</div>
            <div className="tabular-nums">
                Score {point.round.score} · {point.round.holes} holes
            </div>
        </div>
    );
}

/** The key beside the pickers: each Round solid in the SG Category's colour, the Last 20 average dashed. */
export function TrendLegend() {
    return (
        <div className="flex gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden>
                    <line x1="0" x2="16" y1="2" y2="2" stroke="currentColor" strokeWidth="3" />
                    <circle cx="8" cy="2" r="2" fill="currentColor" />
                </svg>
                Round
            </span>
            <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden>
                    <line x1="0" x2="16" y1="2" y2="2" stroke="var(--chart-bar)" strokeWidth="2" strokeDasharray="4 2" />
                </svg>
                Last 20 average
            </span>
        </div>
    );
}
