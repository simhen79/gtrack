/**
 * PROTOTYPE ONLY (#28): three variants of the Practice Grounds page (list and editor, cards and
 * a flyout, a Facility matrix), switchable with `?variant=A|B|C` on /prototype/practice-grounds.
 * Facilities and features are the real reference rows; Practice Grounds live in memory.
 * Lives on the prototype/28-practice-grounds branch, never main.
 */
import type { FacilityData } from '@gtrack/types';
import { Head } from '@inertiajs/react';
import { PrototypeSwitcher, useVariant } from '../../components/prototype-switcher';
import type { ShellProps } from '../../layouts/app-shell';
import { useGrounds } from '../../prototype/practice-grounds/model';
import { VariantA } from '../../prototype/practice-grounds/variant-a';
import { VariantB } from '../../prototype/practice-grounds/variant-b';
import { VariantC } from '../../prototype/practice-grounds/variant-c';

const VARIANTS = [
    { key: 'A', name: 'List and editor' },
    { key: 'B', name: 'Cards and flyout' },
    { key: 'C', name: 'Facility matrix' },
] as const;

export default function PracticeGroundsPrototype({ facilities }: { facilities: FacilityData[] }) {
    const model = useGrounds(facilities);
    const variant = useVariant(VARIANTS.map((v) => v.key));

    return (
        <>
            <Head title="Practice Grounds (prototype)" />
            {variant === 'A' && <VariantA model={model} />}
            {variant === 'B' && <VariantB model={model} />}
            {variant === 'C' && <VariantC model={model} />}
            <PrototypeSwitcher variants={[...VARIANTS]} current={variant} state={model.grounds} />
        </>
    );
}

PracticeGroundsPrototype.layout = { title: 'Practice Grounds' } satisfies ShellProps;
