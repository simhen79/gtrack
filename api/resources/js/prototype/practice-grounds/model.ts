/**
 * PROTOTYPE ONLY (#28). Practice Grounds held in memory, so the variants can be clicked through
 * without a table. Facilities and features are the real reference rows. Nothing persists.
 */
import type { FacilityData } from '@gtrack/types';
import { useState } from 'react';

export type Ground = {
    id: string;
    name: string;
    note: string;
    facilityIds: string[];
    featureIds: string[];
    archivedAt: string | null;
};

export type GroundsModel = ReturnType<typeof useGrounds>;

const byKey = (facilities: FacilityData[], key: string) => facilities.find((facility) => facility.key === key);

function seed(facilities: FacilityData[]): Ground[] {
    const range = byKey(facilities, 'range_bay');
    const chip = byKey(facilities, 'chipping_area');
    const putt = byKey(facilities, 'putting_green');
    const bunker = byKey(facilities, 'practice_bunker');
    const feature = (facility: FacilityData | undefined, key: string) => facility?.features.find((f) => f.key === key)?.id;

    return [
        {
            id: 'g1',
            name: 'Home club',
            note: 'Chipping green slopes back to front. Range has a 150 m flag.',
            facilityIds: [range, chip, putt, bunker].flatMap((f) => (f ? [f.id] : [])),
            featureIds: [feature(range, 'grass'), feature(range, 'target_flags'), feature(chip, 'green_with_hole'), feature(chip, 'slopes'), feature(putt, 'slopes')].flatMap((id) => (id ? [id] : [])),
            archivedAt: null,
        },
        {
            id: 'g2',
            name: 'Driving range near work',
            note: '',
            facilityIds: [range, putt].flatMap((f) => (f ? [f.id] : [])),
            featureIds: [feature(range, 'mats'), feature(range, 'distance_signs')].flatMap((id) => (id ? [id] : [])),
            archivedAt: null,
        },
        {
            id: 'g3',
            name: 'Old municipal course',
            note: 'Closed for renovation.',
            facilityIds: [chip, putt].flatMap((f) => (f ? [f.id] : [])),
            featureIds: [],
            archivedAt: '2026-08-02',
        },
    ];
}

export function useGrounds(facilities: FacilityData[]) {
    const [grounds, setGrounds] = useState<Ground[]>(() => seed(facilities));
    const update = (id: string, change: (ground: Ground) => Ground) => setGrounds((all) => all.map((ground) => (ground.id === id ? change(ground) : ground)));

    return {
        facilities,
        grounds,
        active: grounds.filter((ground) => ground.archivedAt === null),
        archived: grounds.filter((ground) => ground.archivedAt !== null),
        add: (name = 'New Practice Ground') => {
            const id = `g${Date.now()}`;
            setGrounds((all) => [...all, { id, name, note: '', facilityIds: [], featureIds: [], archivedAt: null }]);
            return id;
        },
        rename: (id: string, name: string) => update(id, (ground) => ({ ...ground, name })),
        setNote: (id: string, note: string) => update(id, (ground) => ({ ...ground, note })),
        /** Taking a Facility away takes its features with it: a feature only sits on a Facility the ground has. */
        toggleFacility: (id: string, facility: FacilityData, on: boolean) =>
            update(id, (ground) => ({
                ...ground,
                facilityIds: on ? [...ground.facilityIds, facility.id] : ground.facilityIds.filter((other) => other !== facility.id),
                featureIds: on ? ground.featureIds : ground.featureIds.filter((featureId) => !facility.features.some((feature) => feature.id === featureId)),
            })),
        toggleFeature: (id: string, featureId: string, on: boolean) =>
            update(id, (ground) => ({ ...ground, featureIds: on ? [...ground.featureIds, featureId] : ground.featureIds.filter((other) => other !== featureId) })),
        archive: (id: string) => update(id, (ground) => ({ ...ground, archivedAt: new Date().toISOString().slice(0, 10) })),
        restore: (id: string) => update(id, (ground) => ({ ...ground, archivedAt: null })),
    };
}

export const facilityName = (facilities: FacilityData[], id: string) => facilities.find((facility) => facility.id === id)?.name ?? '?';
