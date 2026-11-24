import { Button, Card, ListBox, Select, Skeleton, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { formatSG, parseSG, SG_CATEGORIES } from '@gtrack/design';
import type { BaselineData, SgBandTrendData, SgTrendData, TrendRoundData } from '@gtrack/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { SgCategoryBadge, sgCategoryKey, type SgCategoryKey } from '../../components/sg-category';
import { SgValue } from '../../components/sg-value';
import { TrendChart, TrendLegend } from '../../components/trend-chart';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';

type TrendWindow = '5' | '10';

type Props = {
    baselines: BaselineData[];
    baseline_id: string | null;
    window: TrendWindow;
    rounds: TrendRoundData[];
    categories: SgTrendData[];
};

/** From here the four charts sit in a 2×2 grid, and one can be expanded. */
const WIDE = '(min-width: 64rem)';

const SELECTED_SEGMENT = 'data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground';

/** How many of the most recent Rounds to show, as the server takes it in `?window=`. */
const WINDOWS: { id: TrendWindow; label: string }[] = [
    { id: '5', label: 'Last 5' },
    { id: '10', label: 'Last 10' },
];

/**
 * Strokes Gained trends on one Baseline: a chart per SG Category showing the last 5 or 10 Rounds,
 * against the last 20 Rounds' average, per 18 holes. At desktop width one chart can be expanded,
 * with its distance bands.
 */
export default function Trends({ baselines, baseline_id, window, rounds, categories }: Props) {
    const wide = useMediaQuery(WIDE);
    const [expanded, setExpanded] = useState<SgCategoryKey | null>(null);
    const [loading, setLoading] = useState(false);

    if (rounds.length === 0 && baselines.length === 0) {
        return (
            <>
                <Head title="Trends" />
                <p className="text-muted">No Rounds yet. Enter a Round to see your Strokes Gained trends.</p>
            </>
        );
    }

    const recentLabel = WINDOWS.find(({ id }) => id === window)!.label;
    const visit = (query: { baseline?: string; window?: TrendWindow }) =>
        router.get(
            '/trends',
            { ...(baseline_id && { baseline: baseline_id }), window, ...query },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );

    const domain = sharedDomain(categories);
    const shown = expanded && wide ? expanded : null;
    const trends = categories.map((trend) => ({
        key: sgCategoryKey(trend.category),
        trend,
    }));
    const card = ({ key, trend }: (typeof trends)[number], size: CardSize) => (
        <TrendCard
            key={key}
            category={key}
            trend={trend}
            rounds={rounds}
            recentLabel={recentLabel}
            domain={domain}
            size={size}
            onExpand={wide ? () => setExpanded(shown === key ? null : key) : undefined}
            className={size === 'big' ? 'lg:col-span-12' : size === 'small' ? 'lg:col-span-4' : 'lg:col-span-6'}
        />
    );

    return (
        <>
            <Head title="Trends" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-12">
                    <div className="flex flex-wrap items-center gap-3">
                        <BaselinePicker baselines={baselines} value={baseline_id} onPick={(baseline) => visit({ baseline })} />
                        <WindowPicker value={window} onPick={(window) => visit({ window })} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[13px] text-muted">Per 18 holes, 9-hole Rounds count double</span>
                        <TrendLegend />
                    </div>
                </div>

                {loading ? (
                    SG_CATEGORIES.map(({ key }) => <Skeleton key={key} className="h-64 rounded-[24px] lg:col-span-6" />)
                ) : rounds.length === 0 ? (
                    <p className="text-muted lg:col-span-12">No Rounds on this Baseline yet.</p>
                ) : shown ? (
                    <>
                        {card(
                            trends.find(({ key }) => key === shown)!,
                            'big',
                        )}
                        {trends.filter(({ key }) => key !== shown).map((trend) => card(trend, 'small'))}
                    </>
                ) : (
                    trends.map((trend) => card(trend, 'grid'))
                )}
            </div>
        </>
    );
}

Trends.layout = { title: 'Trends' } satisfies ShellProps;

/** A segmented toggle for up to four Baselines, a Select beyond that. */
function BaselinePicker({ baselines, value, onPick }: { baselines: BaselineData[]; value: string | null; onPick: (id: string) => void }) {
    if (baselines.length > 4) {
        return (
            <Select aria-label="Baseline" className="w-64" value={value} onChange={(key) => key !== null && onPick(String(key))}>
                <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                    <ListBox>
                        {baselines.map((baseline) => (
                            <ListBox.Item key={baseline.id} id={baseline.id} textValue={baseline.name}>
                                {baseline.name}
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Select.Popover>
            </Select>
        );
    }

    return (
        <ToggleButtonGroup
            aria-label="Baseline"
            selectionMode="single"
            disallowEmptySelection
            className="w-max flex-wrap rounded-full bg-surface-secondary p-1"
            selectedKeys={value ? [value] : []}
            onSelectionChange={(keys) => onPick(String([...keys][0]))}
        >
            {baselines.map((baseline) => (
                <ToggleButton key={baseline.id} id={baseline.id} className={SELECTED_SEGMENT}>
                    {baseline.name}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

/** How many of the most recent Rounds the charts show; the Last 20 average stays as the dashed line to compare. */
function WindowPicker({ value, onPick }: { value: TrendWindow; onPick: (window: TrendWindow) => void }) {
    return (
        <ToggleButtonGroup
            aria-label="Average over"
            selectionMode="single"
            disallowEmptySelection
            className="w-max flex-wrap rounded-full bg-surface-secondary p-1"
            selectedKeys={[value]}
            onSelectionChange={(keys) => onPick([...keys][0] as TrendWindow)}
        >
            {WINDOWS.map(({ id, label }) => (
                <ToggleButton key={id} id={id} className={SELECTED_SEGMENT}>
                    {label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

type CardSize = 'grid' | 'big' | 'small';

const CHART_HEIGHT = { grid: 180, big: 300, small: 70 };

/** The shown Rounds' average in `stat` and Last 20 smaller; the small cards under an expanded chart drop to `stat-sm`. */
const LAST_VALUE_SIZE = {
    grid: { recent: 'text-[32px]', last_20: 'text-[16px]' },
    big: { recent: 'text-[32px]', last_20: 'text-[16px]' },
    small: { recent: 'text-[16px]', last_20: 'text-[13px]' },
};

type CardProps = {
    category: SgCategoryKey;
    trend: SgTrendData;
    rounds: TrendRoundData[];
    recentLabel: string;
    domain: [number, number];
    size: CardSize;
    onExpand?: () => void;
    className: string;
};

/** One SG Category: the shown Rounds' and Last 20 averages over its chart. */
function TrendCard({ category, trend, rounds, recentLabel, domain, size, onExpand, className }: CardProps) {
    const name = SG_CATEGORIES.find(({ key }) => key === category)!.name;

    return (
        <Card className={className}>
            <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-3">
                {size === 'big' ? <SgCategoryBadge category={category} /> : <SgCategoryBadge category={category} long />}
                <span className="flex items-center gap-4">
                    {size !== 'big' && <LastValues trend={trend} size={size} recentLabel={recentLabel} />}
                    {onExpand && (
                        <Button size="sm" variant="tertiary" onPress={onExpand}>
                            {size === 'big' ? 'Collapse' : 'Expand'}
                        </Button>
                    )}
                </span>
            </Card.Header>
            <Card.Content>
                {size === 'big' && (
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                        <h2 className="text-[28px] font-extrabold">{name}</h2>
                        <LastValues trend={trend} size={size} recentLabel={recentLabel} />
                    </div>
                )}
                <TrendChart category={category} trend={trend} rounds={rounds} domain={domain} height={CHART_HEIGHT[size]} axis={size !== 'small'} />
                {size === 'big' && trend.bands.some(({ value }) => value !== null) && <BandChart bands={trend.bands} />}
            </Card.Content>
        </Card>
    );
}

function LastValues({ trend, size, recentLabel }: { trend: SgTrendData; size: CardSize; recentLabel: string }) {
    return (
        <span className="flex items-start gap-4 text-right text-[13px]">
            {(['recent', 'last_20'] as const).map((series) => (
                <span key={series} className="flex flex-col">
                    <span className="text-muted">{series === 'recent' ? recentLabel : 'Last 20'}</span>
                    <SgValue value={trend[series]} className={LAST_VALUE_SIZE[size][series]} />
                </span>
            ))}
        </span>
    );
}

/** Strokes Gained per 18 by distance band, averaged over the last 20 Rounds that entered it. */
function BandChart({ bands }: { bands: SgBandTrendData[] }) {
    const data = bands.map((band) => ({
        label: band.label,
        value: band.value === null ? null : parseSG(band.value),
    }));

    return (
        <div className="mt-6">
            <p className="text-[13px] font-bold">By distance band, last 20 Rounds</p>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        height={40}
                        tick={({ x, y, index }) => <BandTick x={Number(x)} y={Number(y)} {...data[index]} />}
                    />
                    <YAxis hide domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
                    <ReferenceLine y={0} stroke="var(--muted)" strokeWidth={1.5} />
                    <Bar dataKey="value" radius={6} isAnimationActive={false}>
                        {data.map(({ label, value }) => (
                            <Cell key={label} fill={value !== null && value > 0 ? 'var(--sg-positive)' : 'var(--sg-negative)'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/** A band's average, signed, over its distance. */
function BandTick({ x, y, label, value }: { x: number; y: number; label: string; value: number | null }) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={11}>
            <tspan
                x={x}
                dy="0.9em"
                fontSize={12}
                fontWeight={800}
                fill={value === null ? 'var(--muted)' : value > 0 ? 'var(--sg-positive)' : value < 0 ? 'var(--sg-negative)' : 'var(--sg-zero)'}
            >
                {value === null ? '—' : formatSG(value)}
            </tspan>
            <tspan x={x} dy="1.4em" fill="var(--muted)">
                {label}
            </tspan>
        </text>
    );
}

/** One y-scale for all four charts, at least +2 to −4, widened to fit every value. */
function sharedDomain(categories: SgTrendData[]): [number, number] {
    const values = categories.flatMap((trend) => [...trend.values, trend.last_20 ?? '0']).map((value) => parseSG(value) ?? 0);
    return [Math.min(-4, Math.floor(Math.min(...values))), Math.max(2, Math.ceil(Math.max(...values)))];
}
