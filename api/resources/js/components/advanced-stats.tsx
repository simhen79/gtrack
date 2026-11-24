import { Button, FieldError, Label, NumberField, Sheet } from '@heroui/react';
import { parseSG } from '@gtrack/design';
import type { RoundStatsData, SgBandData, SgCategory } from '@gtrack/types';
import { ChevronRight } from '@gravity-ui/icons';
import type { ReactNode } from 'react';
import { BandGrid } from './band-grid';
import { MissCross, type MissSide } from './miss-cross';
import { SgCategoryBadge, sgCategoryKey } from './sg-category';
import { SgValue } from './sg-value';

const MISS_SIDES: MissSide[] = ['long', 'short', 'left', 'right'];
const missField = (side: MissSide) => `approach_miss_${side}_percent` as const;

/** Which advanced stats belong to each SG Category. Approach and Putting also have distance bands. */
export const CATEGORY_STATS: Record<SgCategory, (keyof RoundStatsData)[]> = {
    off_the_tee: ['fairways_hit_percent', 'fairways_missed_left_percent', 'fairways_missed_right_percent', 'penalties'],
    approach: MISS_SIDES.map(missField),
    short_game: ['up_and_downs_percent', 'sand_saves_percent'],
    putting: [],
};

const NAMES: Record<SgCategory, string> = {
    off_the_tee: 'Off the Tee',
    approach: 'Approach',
    short_game: 'Short Game',
    putting: 'Putting',
};

const OFFERS: Record<SgCategory, string> = {
    off_the_tee: 'Fairways and penalties',
    approach: 'Miss cross and Strokes Gained by distance',
    short_game: 'Up and downs and sand saves',
    putting: 'Strokes Gained by distance',
};

export type AdvancedValues = {
    stats: RoundStatsData;
    onStatChange: (field: keyof RoundStatsData, value: number | null) => void;
    sgBands: SgBandData[];
    /** Strokes Gained as typed, by SG band id. */
    bands: Record<string, string>;
    onBandChange: (bandId: string, value: string) => void;
    errors: Partial<Record<string, string>>;
};

const bandsOf = (category: SgCategory, sgBands: SgBandData[]) => sgBands.filter((band) => band.sg_category === category);

/** What a closed Advanced button says: what's filled in, or what the category offers. */
export function advancedSummary(category: SgCategory, { stats, bands, sgBands }: Pick<AdvancedValues, 'stats' | 'bands' | 'sgBands'>): string {
    const statCount = CATEGORY_STATS[category].filter((field) => stats[field] !== null).length;
    const bandCount = bandsOf(category, sgBands).filter((band) => parseSG(bands[band.id] ?? '') !== null).length;
    const parts = [
        statCount > 0 && `${statCount} ${statCount === 1 ? 'stat' : 'stats'}`,
        bandCount > 0 && `${bandCount} ${bandCount === 1 ? 'band' : 'bands'}`,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : `Optional. ${OFFERS[category]}`;
}

/** How many of a category's advanced fields the server refused. */
export function advancedErrorCount(category: SgCategory, { errors, sgBands }: Pick<AdvancedValues, 'errors' | 'sgBands'>): number {
    return (
        CATEGORY_STATS[category].filter((field) => `stats.${field}` in errors).length +
        bandsOf(category, sgBands).filter((band) => `bands.${band.id}` in errors).length
    );
}

/** Opens a category's advanced stats. `standalone` names the category, where it isn't under its row. */
export function AdvancedButton(props: { category: SgCategory; summary: string; errorCount: number; onPress: () => void; standalone?: boolean }) {
    const { category, errorCount, standalone = false } = props;

    return (
        <Button
            variant="ghost"
            onPress={props.onPress}
            className="h-auto w-full justify-between gap-3 rounded-[12px] px-3 py-2 text-left"
            aria-label={`Advanced ${NAMES[category]}: ${errorCount > 0 ? `${errorCount} to fix` : props.summary}`}
            data-has-error={errorCount > 0 || undefined}
        >
            <span className="flex min-w-0 items-center gap-3">
                {standalone && <SgCategoryBadge category={sgCategoryKey(category)} />}
                <span className="flex min-w-0 flex-col">
                    <span className="text-[14px] font-bold">Advanced {NAMES[category]}</span>
                    <span className={`truncate text-[13px] font-medium ${errorCount > 0 ? 'text-danger' : 'text-muted'}`}>
                        {errorCount > 0 ? `${errorCount} to fix` : props.summary}
                    </span>
                </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </Button>
    );
}

/**
 * One SG Category's optional advanced stats, in a panel from the right on a wide screen and
 * a sheet from the bottom narrower: Off the Tee fairways and penalties, the Approach miss cross,
 * up and downs and sand saves, and Approach and Putting by distance band. Every stat but
 * penalties is a percentage. Once any distance band is entered, the category's Strokes Gained
 * is the sum of its bands; otherwise the value typed for it stands. Values save with the Round.
 *
 * Values aren't clamped as they're typed: one out of range stays as typed, and the
 * server's refusal shows under it.
 */
export function AdvancedSheet({
    category,
    onClose,
    placement,
    value,
    fromBands,
    ...values
}: AdvancedValues & {
    /** The category whose stats are open, or null when none is. */
    category: SgCategory | null;
    onClose: () => void;
    placement: 'right' | 'bottom';
    /** The category's Strokes Gained as it stands, typed or summed. */
    value: string;
    fromBands: boolean;
}) {
    // A NumberField commits what's typed when it loses focus, so blur it before the sheet closes:
    // Escape or a click outside would otherwise unmount it with the value uncommitted.
    const close = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        onClose();
    };

    return (
        <Sheet isOpen={category !== null} onOpenChange={(open) => !open && close()} placement={placement}>
            <Sheet.Backdrop variant="transparent">
                <Sheet.Content className={placement === 'right' ? 'w-full max-w-[520px]' : 'max-h-[85vh]'}>
                    {/* Square on the edge it slides in from, so it reads as attached to the screen. */}
                    <Sheet.Dialog
                        aria-label={category ? `Advanced ${NAMES[category]}` : 'Advanced stats'}
                        className={placement === 'right' ? 'rounded-r-none' : 'rounded-b-none'}
                    >
                        {category && (
                            <>
                                <Sheet.Header className="flex flex-row items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <SgCategoryBadge category={sgCategoryKey(category)} long />
                                        <Sheet.Heading className="text-[20px] font-extrabold">Advanced {NAMES[category]}</Sheet.Heading>
                                    </div>
                                    <div className="text-right">
                                        <SgValue value={value} className="text-[28px] leading-none" />
                                        <p className="text-[12px] font-bold text-muted">{fromBands ? 'Sum of bands' : 'As typed'}</p>
                                    </div>
                                </Sheet.Header>
                                <Sheet.Body className="flex flex-col gap-5 overflow-y-auto">
                                    <AdvancedBody category={category} {...values} />
                                </Sheet.Body>
                                <Sheet.Footer>
                                    <Button size="lg" className="w-full" onPress={close}>
                                        Done
                                    </Button>
                                </Sheet.Footer>
                            </>
                        )}
                    </Sheet.Dialog>
                </Sheet.Content>
            </Sheet.Backdrop>
        </Sheet>
    );
}

function AdvancedBody({ category, stats, onStatChange, sgBands, bands, onBandChange, errors }: AdvancedValues & { category: SgCategory }) {
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
    const bandGrid = (
        <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold text-muted">Strokes Gained by distance</span>
            <BandGrid bands={bandsOf(category, sgBands)} values={bands} onChange={onBandChange} errors={errors} className="grid-cols-2" />
            <p className="text-[13px] text-muted">
                Once you enter any band, {NAMES[category]}’s Strokes Gained is the sum of its bands. Blank bands count as 0.
            </p>
        </div>
    );

    const body: Record<SgCategory, ReactNode> = {
        off_the_tee: (
            <div className="grid grid-cols-2 items-start gap-3">
                {stat('fairways_hit_percent', 'Fairways hit')}
                {stat('fairways_missed_left_percent', 'Missed left')}
                {stat('fairways_missed_right_percent', 'Missed right')}
                {stat('penalties', 'Penalties')}
            </div>
        ),
        approach: (
            <>
                <div className="flex flex-col items-center gap-2">
                    <span className="self-start text-[13px] font-bold text-muted">Miss cross, % of misses</span>
                    <MissCross
                        value={Object.fromEntries(MISS_SIDES.map((side) => [side, stats[missField(side)]])) as Record<MissSide, number | null>}
                        onChange={(side, percent) => onStatChange(missField(side), percent)}
                        errors={Object.fromEntries(
                            MISS_SIDES.flatMap((side) => {
                                const error = errors[`stats.${missField(side)}`];
                                return error ? [[side, error]] : [];
                            }),
                        )}
                    />
                </div>
                {bandGrid}
            </>
        ),
        short_game: (
            <div className="grid grid-cols-2 items-start gap-3">
                {stat('up_and_downs_percent', 'Up and downs')}
                {stat('sand_saves_percent', 'Sand saves')}
            </div>
        ),
        putting: bandGrid,
    };

    return body[category];
}
