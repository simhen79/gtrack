/**
 * PROTOTYPE ONLY (#28), variant C: the Facility matrix. Practice Grounds are rows and Facilities
 * are columns, ticked in place, with each Facility's features as chips in its cell. Names and
 * notes edit inline. Good for comparing grounds side by side; the narrow screen scrolls sideways.
 */
import { Button } from '@heroui/react';
import { useState } from 'react';
import type { Ground, GroundsModel } from './model';
import { ArchiveGround, FeatureChip, Tick } from './shared';

export function VariantC({ model }: { model: GroundsModel }) {
    const [showArchived, setShowArchived] = useState(false);
    const rows = showArchived ? [...model.active, ...model.archived] : model.active;

    const row = (ground: Ground) => {
        const archived = ground.archivedAt !== null;
        return (
            <tr key={ground.id} className={`border-t border-(--field-border) align-top ${archived ? 'opacity-50' : ''}`}>
                <th scope="row" className="sticky left-0 z-10 min-w-56 bg-surface p-3 text-left font-normal">
                    <input
                        aria-label="Practice Ground name"
                        value={ground.name}
                        disabled={archived}
                        onChange={(event) => model.rename(ground.id, event.target.value)}
                        className="w-full rounded-[8px] bg-transparent px-1 py-0.5 text-[15px] font-bold outline-none focus:bg-(--field-background) focus:ring-2 focus:ring-highlight"
                    />
                    <textarea
                        aria-label="Note"
                        value={ground.note}
                        placeholder="Add a note"
                        disabled={archived}
                        rows={ground.note ? 2 : 1}
                        onChange={(event) => model.setNote(ground.id, event.target.value)}
                        className="mt-1 w-full resize-none rounded-[8px] bg-transparent px-1 text-[12px] text-muted outline-none focus:bg-(--field-background) focus:ring-2 focus:ring-highlight"
                    />
                </th>
                {model.facilities.map((facility) => {
                    const has = ground.facilityIds.includes(facility.id);
                    return (
                        <td key={facility.id} className={`min-w-44 p-3 ${has ? 'bg-surface-secondary' : ''}`}>
                            <Tick label={has ? 'Has it' : 'No'} isSelected={has} onChange={(on) => !archived && model.toggleFacility(ground.id, facility, on)} />
                            {has && facility.features.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {facility.features.map((feature) => (
                                        <FeatureChip
                                            key={feature.id}
                                            label={feature.name}
                                            isSelected={ground.featureIds.includes(feature.id)}
                                            onChange={(on) => !archived && model.toggleFeature(ground.id, feature.id, on)}
                                        />
                                    ))}
                                </div>
                            )}
                        </td>
                    );
                })}
                <td className="p-3 text-right whitespace-nowrap">
                    {archived ? (
                        <Button size="sm" variant="secondary" onPress={() => model.restore(ground.id)}>
                            Restore
                        </Button>
                    ) : (
                        <ArchiveGround ground={ground} short onArchive={() => model.archive(ground.id)} />
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="flex flex-col gap-3 rounded-[24px] bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="secondary" onPress={() => model.add()}>
                    + Add a Practice Ground
                </Button>
                <label className="flex items-center gap-2 text-[13px] font-bold text-muted">
                    <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
                    Show {model.archived.length} archived
                </label>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-surface p-3 text-left text-[13px] font-bold text-muted">Practice Ground</th>
                            {model.facilities.map((facility) => (
                                <th key={facility.id} className="p-3 text-left text-[13px] font-bold text-muted">
                                    {facility.name}
                                </th>
                            ))}
                            <th />
                        </tr>
                    </thead>
                    <tbody>{rows.map(row)}</tbody>
                </table>
            </div>
        </div>
    );
}
