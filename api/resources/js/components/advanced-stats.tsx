import { Accordion, FieldError, Label, NumberField } from '@heroui/react';
import type { RoundStatsData, SgBandData } from '@gtrack/types';
import { BandGrid } from './band-grid';
import { MissCross, type MissSide } from './miss-cross';
import { SgCategoryBadge } from './sg-category';

/** Each SG Category's stats on their own tile, so the four groups read apart. */
const GROUP = 'flex flex-col gap-3 rounded-[18px] bg-surface-secondary p-4';

type Props = {
    stats: RoundStatsData;
    onStatChange: (field: keyof RoundStatsData, value: number | null) => void;
    sgBands: SgBandData[];
    /** Strokes Gained as typed, by SG band id. */
    bands: Record<string, string>;
    onBandChange: (bandId: string, value: string) => void;
    errors: Partial<Record<string, string>>;
    isExpanded: boolean;
    onExpandedChange: (isExpanded: boolean) => void;
};

/**
 * A Round's optional advanced stats, folded away until opened: Off the Tee fairways
 * and penalties, the Approach miss cross, up and downs and sand saves, and Approach
 * and Putting by distance band. Every stat but penalties is a percentage.
 *
 * Values aren't clamped as they're typed: one out of range stays as typed, and the
 * server's refusal shows under it.
 */
export function AdvancedStats({ stats, onStatChange, sgBands, bands, onBandChange, errors, isExpanded, onExpandedChange }: Props) {
    const stat = (field: keyof RoundStatsData, label: string, percent = field.endsWith('_percent')) => (
        <NumberField
            step={1}
            value={stats[field] ?? Number.NaN}
            onChange={(value) => onStatChange(field, Number.isNaN(value) ? null : value)}
            isInvalid={`stats.${field}` in errors}
        >
            <Label>{percent ? `${label} (%)` : label}</Label>
            <NumberField.Group>
                <NumberField.Input className="tabular-nums" placeholder={percent ? '%' : undefined} />
            </NumberField.Group>
            <FieldError>{errors[`stats.${field}`]}</FieldError>
        </NumberField>
    );
    const missField = (side: MissSide) => `approach_miss_${side}_percent` as const;
    const sides: MissSide[] = ['long', 'short', 'left', 'right'];

    return (
        <Accordion
            className="rounded-[24px] bg-surface"
            expandedKeys={isExpanded ? ['advanced'] : []}
            onExpandedChange={(keys) => onExpandedChange(keys.has('advanced'))}
        >
            <Accordion.Item id="advanced">
                <Accordion.Heading>
                    <Accordion.Trigger className="min-h-14 px-5 py-3 text-left">
                        <span className="flex flex-col">
                            <span className="text-[18px] font-bold">Advanced stats</span>
                            <span className="text-[13px] font-medium text-muted">
                                Optional. Fairways, misses, up and downs, sand saves, and Strokes Gained by distance band.
                            </span>
                        </span>
                        <Accordion.Indicator />
                    </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                    <Accordion.Body className="flex flex-col gap-3 px-5 pb-5">
                        <section className={GROUP}>
                            <SgCategoryBadge category="ott" long />
                            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
                                {stat('fairways_hit_percent', 'Fairways hit')}
                                {stat('fairways_missed_left_percent', 'Missed left')}
                                {stat('fairways_missed_right_percent', 'Missed right')}
                                {stat('penalties', 'Penalties')}
                            </div>
                        </section>

                        <section className={GROUP}>
                            <SgCategoryBadge category="app" long />
                            <div className="flex flex-col gap-6 sm:flex-row">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[13px] font-bold text-muted">Miss cross, % of misses</span>
                                    <MissCross
                                    value={Object.fromEntries(sides.map((side) => [side, stats[missField(side)]])) as Record<MissSide, number | null>}
                                    onChange={(side, percent) => onStatChange(missField(side), percent)}
                                    errors={Object.fromEntries(
                                        sides.flatMap((side) => {
                                            const error = errors[`stats.${missField(side)}`];
                                            return error ? [[side, error]] : [];
                                        }),
                                    )}
                                    />
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
                                    <span className="text-[13px] font-bold text-muted">Strokes Gained by distance</span>
                                    <BandGrid
                                        bands={sgBands.filter((band) => band.sg_category === 'approach')}
                                        values={bands}
                                        onChange={onBandChange}
                                        errors={errors}
                                        className="grid-cols-2 sm:grid-cols-3"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className={GROUP}>
                            <SgCategoryBadge category="shg" long />
                            <div className="grid grid-cols-2 items-start gap-3 sm:w-96">
                                {stat('up_and_downs_percent', 'Up and downs')}
                                {stat('sand_saves_percent', 'Sand saves')}
                            </div>
                        </section>

                        <section className={GROUP}>
                            <SgCategoryBadge category="put" long />
                            <span className="text-[13px] font-bold text-muted">Strokes Gained by distance</span>
                            <BandGrid
                                bands={sgBands.filter((band) => band.sg_category === 'putting')}
                                values={bands}
                                onChange={onBandChange}
                                errors={errors}
                                className="grid-cols-2 sm:grid-cols-4 xl:grid-cols-6"
                            />
                        </section>

                        <p className="text-[13px] text-muted">
                            Once you enter any distance band, that SG Category’s Strokes Gained is the sum of its bands. Blank bands count as 0.
                        </p>
                    </Accordion.Body>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}
