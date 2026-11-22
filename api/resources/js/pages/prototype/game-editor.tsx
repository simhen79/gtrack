/**
 * PROTOTYPE ONLY (#25): three variants of the one-screen Game editor (one long form, tabs with a live
 * preview, Levels first split by what makes a new version), switchable with `?variant=A|B|C` on
 * /admin/prototype/game-editor. `?game=new` starts from a blank Game instead of a published v1.
 * Facilities, features and distance groups are the real rows; the Game lives in memory.
 * Lives on the prototype/25-game-editor branch, never main.
 */
import type { DistanceGroupData, FacilityData } from '@gtrack/types';
import { Head } from '@inertiajs/react';
import { PrototypeSwitcher, useVariant } from '../../components/prototype-switcher';
import type { ShellProps } from '../../layouts/app-shell';
import { StartingLevels } from '../../prototype/game-editor/fields';
import { useGameEditor } from '../../prototype/game-editor/model';
import { VariantA } from '../../prototype/game-editor/variant-a';
import { VariantB } from '../../prototype/game-editor/variant-b';
import { VariantC } from '../../prototype/game-editor/variant-c';

const VARIANTS = [
    { key: 'A', name: 'One long form' },
    { key: 'B', name: 'Tabs and live preview' },
    { key: 'C', name: 'Levels first, split by version' },
] as const;

export default function GameEditorPrototype({ facilities, distance_groups }: { facilities: FacilityData[]; distance_groups: DistanceGroupData[] }) {
    const mode = new URLSearchParams(window.location.search).get('game') === 'new' ? 'new' : 'edit';
    const model = useGameEditor(facilities, distance_groups, mode);
    const variant = useVariant(VARIANTS.map((v) => v.key));
    const other = new URL(window.location.href);
    other.searchParams.set('game', mode === 'new' ? 'edit' : 'new');

    return (
        <div className="flex flex-col gap-6">
            <Head title="Game editor (prototype)" />
            <p className="rounded-[16px] border-2 border-dashed border-fuchsia-500 px-4 py-2 text-[13px]">
                PROTOTYPE · {mode === 'edit' ? 'Editing published v1 of “Flag Zone 100-150”.' : 'A new Game, blank.'}{' '}
                <a className="font-bold underline" href={other.toString()}>
                    {mode === 'edit' ? 'Try a new Game instead' : 'Try editing a published Game instead'}
                </a>
            </p>
            {variant === 'A' && <VariantA model={model} />}
            {variant === 'B' && <VariantB model={model} />}
            {variant === 'C' && <VariantC model={model} />}
            <StartingLevels />
            <PrototypeSwitcher variants={[...VARIANTS]} current={variant} state={{ game: model.game, checks: model.checks.map((c) => c.message), versionChanges: model.changes }} />
        </div>
    );
}

GameEditorPrototype.layout = { title: 'Edit Game' } satisfies ShellProps;
