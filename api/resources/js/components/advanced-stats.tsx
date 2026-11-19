import { Accordion, Label, NumberField } from '@heroui/react';
import type { RoundStatsData, SgBandData } from '@gtrack/types';
import { BandGrid } from './band-grid';
import { MissCross, type MissSide } from './miss-cross';
import { SgCategoryBadge } from './sg-category';

type CountField = 'fairways_hit' | 'fairways_missed_left' | 'fairways_missed_right' | 'penalties' | 'up_and_downs_made' | 'up_and_downs_attempted';

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
 * A Round's optional advanced stats, folded away until opened: Off the Tee counts,
 * the Approach miss cross, up and downs, and Approach and Putting by distance band.
 */
export function AdvancedStats({ stats, onStatChange, sgBands, bands, onBandChange, errors, isExpanded, onExpandedChange }: Props) {
    const count = (field: CountField, label: string) => (
        <NumberField
            minValue={0}
            maxValue={99}
            step={1}
            value={stats[field] ?? Number.NaN}
            onChange={(value) => onStatChange(field, Number.isNaN(value) ? null : value)}
            isInvalid={`stats.${field}` in errors}
        >
            <Label>{label}</Label>
            <NumberField.Group>
                <NumberField.Input className="tabular-nums" />
            </NumberField.Group>
        </NumberField>
    );
    const missField = (side: MissSide) => `approach_miss_${side}_percent` as const;
    const sides: MissSide[] = ['long', 'short', 'left', 'right'];

    return (
        <Accordion
            className="rounded-[18px] bg-surface-secondary"
            expandedKeys={isExpanded ? ['advanced'] : []}
            onExpandedChange={(keys) => onExpandedChange(keys.has('advanced'))}
        >
            <Accordion.Item id="advanced">
                <Accordion.Heading>
                    <Accordion.Trigger className="min-h-14 px-5 py-3 text-left">
                        <span className="flex flex-col">
                            <span className="text-[18px] font-bold">Advanced stats</span>
                            <span className="text-[13px] font-medium text-muted">
                                Optional. Fairways, misses, up and downs, and Strokes Gained by distance band.
                            </span>
                        </span>
                        <Accordion.Indicator />
                    </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                    <Accordion.Body className="flex flex-col gap-6 px-5 pb-5">
                        <section className="flex flex-col gap-3">
                            <SgCategoryBadge category="ott" long />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {count('fairways_hit', 'Fairways hit')}
                                {count('fairways_missed_left', 'Missed left')}
                                {count('fairways_missed_right', 'Missed right')}
                                {count('penalties', 'Penalties')}
                            </div>
                        </section>

                        <section className="flex flex-col gap-3">
                            <SgCategoryBadge category="app" long />
                            <div className="flex flex-col gap-6 sm:flex-row">
                                <MissCross
                                    value={Object.fromEntries(sides.map((side) => [side, stats[missField(side)]])) as Record<MissSide, number | null>}
                                    onChange={(side, percent) => onStatChange(missField(side), percent)}
                                    invalid={Object.fromEntries(sides.map((side) => [side, `stats.${missField(side)}` in errors]))}
                                />
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

                        <section className="flex flex-col gap-3">
                            <SgCategoryBadge category="shg" long />
                            <div className="grid grid-cols-2 gap-3 sm:w-96">
                                {count('up_and_downs_made', 'Up and downs made')}
                                {count('up_and_downs_attempted', 'Attempted')}
                            </div>
                        </section>

                        <section className="flex flex-col gap-3">
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
