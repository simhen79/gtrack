import { formatSG, parseSG } from '@gtrack/design';
import type { SgTrendData, TrendRoundData } from '@gtrack/types';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { SgCategoryKey } from './sg-category';

/** Hovering one chart moves the marker on all four. */
const SYNC_ID = 'sg-trends';

type Point = { round: TrendRoundData; last_5: number; last_20: number };

type Props = {
    category: SgCategoryKey;
    trend: SgTrendData;
    rounds: TrendRoundData[];
    /** Shared by the four charts, so heights compare across SG Categories. */
    domain: [number, number];
    height: number;
    /** Grid and y-axis labels, for charts with room for them. */
    axis?: boolean;
    /** The hovered Round's index, shared by the four charts; null when the pointer leaves. */
    onHover: (index: number | null) => void;
};

/**
 * One SG Category's rolling Last 5 and Last 20 lines, a point per Round, with a zero line.
 * Colours are CSS variables, so the chart follows the theme.
 */
export function TrendChart({ category, trend, rounds, domain, height, axis = false, onHover }: Props) {
    const points: Point[] = rounds.map((round, i) => ({
        round,
        last_5: parseSG(trend.last_5[i]) ?? 0,
        last_20: parseSG(trend.last_20[i]) ?? 0,
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart
                data={points}
                syncId={SYNC_ID}
                margin={{ top: 8, right: 8, bottom: 8, left: axis ? 0 : 8 }}
                onMouseMove={(state) =>
                    onHover(state.activeTooltipIndex === undefined || state.activeTooltipIndex === null ? null : Number(state.activeTooltipIndex))
                }
                onMouseLeave={() => onHover(null)}
            >
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
                <Tooltip content={TrendTooltip} position={{ y: 0 }} cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4' }} isAnimationActive={false} />
                <Line
                    dataKey="last_20"
                    name="Last 20"
                    stroke="var(--chart-bar)"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                />
                <Line
                    dataKey="last_5"
                    name="Last 5"
                    stroke={`var(--cat-${category})`}
                    strokeWidth={3}
                    dot={false}
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

/** The hovered Round's Last 5, signed; its date and Last 20 show in the card header. */
function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
    const point = payload?.[0]?.payload as Point | undefined;
    if (!active || !point) {
        return null;
    }

    return (
        <div className="rounded-[8px] bg-segment px-2 py-1 text-[13px] font-extrabold text-segment-foreground tabular-nums shadow-lg">
            {formatSG(point.last_5)}
        </div>
    );
}

/** The key under the Baseline picker: Last 5 solid in the SG Category's colour, Last 20 dashed. */
export function TrendLegend() {
    return (
        <div className="flex gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden>
                    <line x1="0" x2="16" y1="2" y2="2" stroke="currentColor" strokeWidth="3" />
                </svg>
                Last 5
            </span>
            <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden>
                    <line x1="0" x2="16" y1="2" y2="2" stroke="var(--chart-bar)" strokeWidth="2" strokeDasharray="4 2" />
                </svg>
                Last 20
            </span>
        </div>
    );
}
