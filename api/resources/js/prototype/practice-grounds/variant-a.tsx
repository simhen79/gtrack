/**
 * PROTOTYPE ONLY (#28), variant A: list and editor. Practice Grounds on the left, the selected
 * one's editor on the right, like the Catalogue. Edits apply as they're made.
 */
import { Button, Input, Label, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import { useMediaQuery } from '../../lib/media';
import { facilityName, type GroundsModel } from './model';
import { ArchiveGround, Tick } from './shared';

export function VariantA({ model }: { model: GroundsModel }) {
    const wide = useMediaQuery('(min-width: 64rem)');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(model.active[0]?.id ?? null);
    const listed = showArchived ? model.archived : model.active;
    const selected = model.grounds.find((ground) => ground.id === selectedId) ?? null;

    const list = (
        <div className="flex flex-col gap-2 rounded-[24px] bg-surface p-3">
            <div className="flex rounded-full bg-surface-secondary p-1">
                {[false, true].map((archived) => (
                    <button
                        key={String(archived)}
                        type="button"
                        onClick={() => setShowArchived(archived)}
                        className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-bold ${showArchived === archived ? 'bg-segment text-segment-foreground' : 'text-muted'}`}
                    >
                        {archived ? `Archived (${model.archived.length})` : `Practice Grounds (${model.active.length})`}
                    </button>
                ))}
            </div>
            <ul className="flex flex-col gap-1">
                {listed.map((ground) => (
                    <li key={ground.id}>
                        <button
                            type="button"
                            onClick={() => setSelectedId(ground.id)}
                            className={`flex w-full flex-col items-start rounded-[16px] px-4 py-3 text-left ${ground.id === selectedId ? 'bg-segment text-segment-foreground' : 'hover:bg-surface-secondary'}`}
                        >
                            <span className="font-bold">{ground.name}</span>
                            <span className="text-[12px] opacity-70">{ground.facilityIds.map((id) => facilityName(model.facilities, id)).join(' · ') || 'No Facilities yet'}</span>
                        </button>
                    </li>
                ))}
                {listed.length === 0 && <li className="px-4 py-3 text-[13px] text-muted">Nothing archived.</li>}
            </ul>
            {!showArchived && (
                <Button variant="secondary" onPress={() => setSelectedId(model.add())}>
                    + Add a Practice Ground
                </Button>
            )}
        </div>
    );

    const editor = selected ? (
        <div className="flex flex-col gap-6 rounded-[24px] bg-surface p-6">
            <TextField value={selected.name} onChange={(value) => model.rename(selected.id, value)} isDisabled={selected.archivedAt !== null}>
                <Label>Name</Label>
                <Input />
            </TextField>

            <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">Facilities and features</span>
                {model.facilities.map((facility) => {
                    const has = selected.facilityIds.includes(facility.id);
                    return (
                        <div key={facility.id} className="flex flex-col gap-2 rounded-[16px] bg-surface-secondary p-3">
                            <Tick label={facility.name} isSelected={has} onChange={(on) => model.toggleFacility(selected.id, facility, on)} />
                            {has && facility.features.length > 0 && (
                                <div className="ms-7 flex flex-wrap gap-x-5 gap-y-2">
                                    {facility.features.map((feature) => (
                                        <Tick
                                            key={feature.id}
                                            label={feature.name}
                                            isSelected={selected.featureIds.includes(feature.id)}
                                            onChange={(on) => model.toggleFeature(selected.id, feature.id, on)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <TextField value={selected.note} onChange={(value) => model.setNote(selected.id, value)}>
                <Label>Note (optional)</Label>
                <TextArea rows={3} placeholder="Layout details Variations can mention, such as a sloping chipping green." />
            </TextField>

            <div className="flex justify-end">
                {selected.archivedAt === null ? (
                    <ArchiveGround ground={selected} onArchive={() => model.archive(selected.id)} />
                ) : (
                    <Button variant="secondary" onPress={() => model.restore(selected.id)}>
                        Restore Practice Ground
                    </Button>
                )}
            </div>
        </div>
    ) : (
        <div className="rounded-[24px] bg-surface p-6 text-muted">Choose a Practice Ground, or add one.</div>
    );

    return wide ? (
        <div className="grid grid-cols-[340px_1fr] items-start gap-4">
            {list}
            {editor}
        </div>
    ) : (
        <div className="flex flex-col gap-4">
            {list}
            {editor}
        </div>
    );
}
