/**
 * PROTOTYPE ONLY (#28), variant B: cards and a flyout. Each Practice Ground is a card showing
 * its four Facilities lit (highlight lime) or struck through, then each Facility's features on a
 * row of their own, divided from the next. Tapping a card opens its editor in the panel from the
 * right (a sheet from the bottom on a phone), as Round entry's advanced stats do.
 */
import { ArrowRotateLeft, Check, Pencil } from '@gravity-ui/icons';
import type { FacilityData } from '@gtrack/types';
import { Button, Input, Label, Sheet, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import { useMediaQuery } from '../../lib/media';
import type { Ground, GroundsModel } from './model';
import { ArchiveGround, ArchiveIconButton, FeatureChip } from './shared';

const SHORT: Record<string, string> = { range_bay: 'Range', chipping_area: 'Chipping', putting_green: 'Putting', practice_bunker: 'Bunker' };

/** Selected but not an action: `highlight` lime, per the design-system README. */
const LIT = 'bg-highlight text-highlight-foreground';

function FacilityStrip({ facilities, ground }: { facilities: FacilityData[]; ground: Ground }) {
    return (
        <div className="grid grid-cols-4 gap-1.5">
            {facilities.map((facility) => {
                const has = ground.facilityIds.includes(facility.id);
                return (
                    <div key={facility.id} className={`rounded-[12px] px-2 py-2 text-center text-[12px] font-bold ${has ? LIT : 'bg-surface-secondary text-muted line-through opacity-60'}`}>
                        {SHORT[facility.key] ?? facility.name}
                    </div>
                );
            })}
        </div>
    );
}

/** Each Facility the ground has, with its ticked features, one row per Facility, divided. */
function FeatureRows({ facilities, ground }: { facilities: FacilityData[]; ground: Ground }) {
    const rows = facilities
        .filter((facility) => ground.facilityIds.includes(facility.id))
        .map((facility) => ({ facility, features: facility.features.filter((feature) => ground.featureIds.includes(feature.id)) }))
        .filter(({ features }) => features.length > 0);

    if (rows.length === 0) return null;

    return (
        <div className="flex flex-col divide-y divide-(--field-border) rounded-[14px] bg-surface-secondary">
            {rows.map(({ facility, features }) => (
                <div key={facility.id} className="flex items-baseline gap-3 px-3 py-2">
                    <span className="w-16 shrink-0 text-[12px] font-bold text-muted">{SHORT[facility.key] ?? facility.name}</span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium">
                        {features.map((feature) => (
                            <span key={feature.id}>{feature.name}</span>
                        ))}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function VariantB({ model }: { model: GroundsModel }) {
    const tablet = useMediaQuery('(min-width: 48rem)');
    const [openId, setOpenId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const open = model.grounds.find((ground) => ground.id === openId) ?? null;

    // A div, not a button: the Edit and Archive icons are buttons of their own. The rest of the card
    // still opens the editor when tapped.
    const card = (ground: Ground) => (
        <div key={ground.id} className={`flex flex-col gap-3 rounded-[24px] bg-surface p-5 transition hover:ring-2 hover:ring-highlight ${ground.archivedAt ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[18px] font-extrabold">{ground.name}</span>
                    {ground.archivedAt && <span className="text-[12px] font-bold text-muted">Archived {ground.archivedAt}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                    <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${ground.name}`} onPress={() => setOpenId(ground.id)}>
                        <Pencil className="size-4" />
                    </Button>
                    {ground.archivedAt === null ? (
                        <ArchiveIconButton ground={ground} onArchive={() => model.archive(ground.id)} />
                    ) : (
                        <Button isIconOnly size="sm" variant="ghost" aria-label={`Restore ${ground.name}`} onPress={() => model.restore(ground.id)}>
                            <ArrowRotateLeft className="size-4" />
                        </Button>
                    )}
                </span>
            </div>
            <button type="button" onClick={() => setOpenId(ground.id)} className="flex flex-col gap-3 text-left" aria-label={`Open ${ground.name}`}>
                <FacilityStrip facilities={model.facilities} ground={ground} />
                <FeatureRows facilities={model.facilities} ground={ground} />
                {ground.note && <span className="line-clamp-2 text-[13px] text-muted">{ground.note}</span>}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
                {model.active.map(card)}
                <button
                    type="button"
                    onClick={() => setOpenId(model.add())}
                    className="flex min-h-40 items-center justify-center rounded-[24px] border-2 border-dashed border-(--field-border) text-[15px] font-bold text-muted hover:text-foreground"
                >
                    + Add a Practice Ground
                </button>
            </div>

            {model.archived.length > 0 && (
                <div className="flex flex-col gap-3">
                    <button type="button" className="self-start text-[13px] font-bold text-muted underline" onClick={() => setShowArchived((shown) => !shown)}>
                        {showArchived ? 'Hide' : 'Show'} {model.archived.length} archived
                    </button>
                    {showArchived && <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">{model.archived.map(card)}</div>}
                </div>
            )}

            <Sheet isOpen={open !== null} onOpenChange={(isOpen) => !isOpen && setOpenId(null)} placement={tablet ? 'right' : 'bottom'}>
                <Sheet.Backdrop variant="transparent">
                    <Sheet.Content className={tablet ? 'w-full max-w-[520px]' : 'max-h-[90vh]'}>
                        <Sheet.Dialog aria-label="Practice Ground" className={tablet ? 'rounded-r-none' : 'rounded-b-none'}>
                            {open && (
                                <>
                                    <Sheet.Header>
                                        <Sheet.Heading className="text-[20px] font-extrabold">{open.archivedAt ? 'Archived Practice Ground' : 'Practice Ground'}</Sheet.Heading>
                                    </Sheet.Header>
                                    <Sheet.Body className="flex flex-col gap-5 overflow-y-auto">
                                        <TextField value={open.name} onChange={(value) => model.rename(open.id, value)}>
                                            <Label>Name</Label>
                                            <Input />
                                        </TextField>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-medium">Facilities and features</span>
                                            {/* One row per Facility, divided: its toggle, then its features right under it. */}
                                            <div className="flex flex-col divide-y divide-(--field-border) rounded-[16px] bg-surface-secondary">
                                                {model.facilities.map((facility) => {
                                                    const has = open.facilityIds.includes(facility.id);
                                                    return (
                                                        <div key={facility.id} className="flex flex-col gap-3 p-3">
                                                            <button
                                                                type="button"
                                                                aria-pressed={has}
                                                                aria-label={`${facility.name}: ${has ? 'this Practice Ground has it' : 'not here'}`}
                                                                onClick={() => model.toggleFacility(open.id, facility, !has)}
                                                                className={`flex items-center justify-between rounded-[12px] px-4 py-3 text-left font-bold ${has ? LIT : 'bg-surface text-muted'}`}
                                                            >
                                                                {facility.name}
                                                                {/* A white check in a black circle when it has it; an empty ring when it doesn't. */}
                                                                {has ? (
                                                                    <span className="flex size-6 items-center justify-center rounded-full bg-black text-white" aria-hidden>
                                                                        <Check className="size-3.5" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="size-6 rounded-full border-2 border-(--field-border)" aria-hidden />
                                                                )}
                                                            </button>
                                                            {has && facility.features.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 ps-2">
                                                                    {facility.features.map((feature) => (
                                                                        <FeatureChip
                                                                            key={feature.id}
                                                                            label={feature.name}
                                                                            isSelected={open.featureIds.includes(feature.id)}
                                                                            onChange={(on) => model.toggleFeature(open.id, feature.id, on)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <TextField value={open.note} onChange={(value) => model.setNote(open.id, value)}>
                                            <Label>Note (optional)</Label>
                                            <TextArea rows={3} />
                                        </TextField>
                                    </Sheet.Body>
                                    <Sheet.Footer className="flex flex-col gap-2">
                                        <Button size="lg" className="w-full" onPress={() => setOpenId(null)}>
                                            Done
                                        </Button>
                                        {open.archivedAt === null ? (
                                            <ArchiveGround
                                                ground={open}
                                                fullWidth
                                                onArchive={() => {
                                                    model.archive(open.id);
                                                    setOpenId(null);
                                                }}
                                            />
                                        ) : (
                                            <Button variant="secondary" className="w-full" onPress={() => model.restore(open.id)}>
                                                Restore Practice Ground
                                            </Button>
                                        )}
                                    </Sheet.Footer>
                                </>
                            )}
                        </Sheet.Dialog>
                    </Sheet.Content>
                </Sheet.Backdrop>
            </Sheet>
        </div>
    );
}
