import { Button, buttonVariants, Card, Checkbox, CheckboxGroup, FieldError, Form, Input, Label, Link, NumberField, TextArea, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { DistanceGroupData, FacilityData, GameVersionData, ScoreBetter, ScoreEntry, SgCategory } from '@gtrack/types';
import { Head, useForm } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { AdminTabs } from '../../components/admin-tabs';
import { LevelMeter } from '../../components/level-meter';
import { SgCategoryBadge, sgCategoryKey } from '../../components/sg-category';
import type { ShellProps } from '../../layouts/app-shell';
import { useFocusFirstError } from '../../lib/forms';
import { placeholders, rulesAt } from '../../lib/rules';

type Props = {
    game: GameVersionData | null;
    earlier_versions: GameVersionData[];
    facilities: FacilityData[];
    category_facilities: Record<SgCategory, string[]>;
    distance_groups: DistanceGroupData[];
};

type LevelRow = { settings: Record<string, string>; up: number | null; down: number | null };

type GameForm = {
    name: string;
    sg_category: SgCategory;
    balls: number | null;
    estimated_minutes: number | null;
    seconds_per_ball: number | null;
    rules: string;
    scoring: string;
    score_better: ScoreBetter;
    score_entry: ScoreEntry;
    /** As typed, such as "0, 1, 2, 3"; sent as numbers. */
    pad_values: string;
    open: string[];
    source_concept: string;
    source_url: string;
    facility_ids: string[];
    feature_ids: string[];
    distance_group_ids: string[];
    levels: LevelRow[];
};

const SG_CATEGORIES: { category: SgCategory; label: string }[] = [
    { category: 'off_the_tee', label: 'Off the Tee' },
    { category: 'approach', label: 'Approach' },
    { category: 'short_game', label: 'Short Game' },
    { category: 'putting', label: 'Putting' },
];

/** HeroUI selects a ToggleButton in accent-soft; the design system selects it on segment. */
const SELECTED_SEGMENT = 'data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground';

/** Changing any of these publishes a new version (as the server decides too); the rest saves in place. */
const VERSIONED: { field: keyof GameForm; label: string }[] = [
    { field: 'rules', label: 'rules' },
    { field: 'scoring', label: 'scoring' },
    { field: 'balls', label: 'ball count' },
    { field: 'estimated_minutes', label: 'estimated minutes' },
    { field: 'facility_ids', label: 'Facilities' },
    { field: 'feature_ids', label: 'features' },
];

/** The page's fields from the top, so the bar names the same problem the form moves to. */
const FIELD_ORDER = ['name', 'levels', 'rules', 'scoring', 'balls', 'facility_ids', 'feature_ids', 'sg_category', 'score', 'pad_values', 'distance_group_ids'];

/** A message the page writes itself, sized and inset like HeroUI's FieldError so every message matches. */
const MESSAGE = 'px-1 text-xs text-danger';

/**
 * The fields whose change answers a publish problem, so its message goes as the admin fixes it: balls or
 * minutes answer either, a wrong-way target is fixed from either target or the better score, and a Level
 * setting or the Levels count can go when the rules drop the placeholder.
 */
function answeredBy(key: string): string[] {
    const target = key.match(/^levels\.(\d+)\.(up|down)$/);
    if (target) {
        return [`levels.${target[1]}.up`, `levels.${target[1]}.down`, 'score_better'];
    }
    if (/^levels\.\d+\.settings\./.test(key)) {
        return [key, 'rules'];
    }
    return { balls: ['balls', 'estimated_minutes'], levels: ['levels', 'rules'], feature_ids: ['feature_ids', 'facility_ids'] }[key] ?? [key];
}

/** The value at a problem's path, such as `levels.2.up`; a path into a typed string, such as `pad_values.2`, stops at the string. */
function valueAt(data: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((value, part) => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[part] : value), data);
}

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });

function fromVersion(game: GameVersionData | null): GameForm {
    return {
        name: game?.name ?? '',
        sg_category: game?.sg_category ?? 'approach',
        balls: game?.balls ?? null,
        estimated_minutes: game?.estimated_minutes ?? null,
        seconds_per_ball: game?.seconds_per_ball ?? null,
        rules: game?.rules ?? '',
        scoring: game?.scoring ?? '',
        score_better: game?.score_better ?? 'higher',
        score_entry: game?.score_entry ?? 'counter',
        pad_values: game?.pad_values.join(', ') ?? '',
        open: game?.open ?? [],
        source_concept: game?.source_concept ?? '',
        source_url: game?.source_url ?? '',
        facility_ids: game?.facility_ids ?? [],
        feature_ids: game?.feature_ids ?? [],
        distance_group_ids: game?.distance_group_ids ?? [],
        levels: game?.levels.map(({ settings, up, down }) => ({ settings, up, down })) ?? [],
    };
}

/**
 * Writes a Game by hand, or edits one, on one screen: the Levels first, then what publishes a new
 * version beside what saves in place. Publishing runs the server's publish check, and each problem
 * shows under its field.
 */
export default function Game({ game, earlier_versions, facilities, category_facilities, distance_groups }: Props) {
    const [saved] = useState(() => fromVersion(game));
    const form = useForm<GameForm>(saved);
    const { data } = form;
    const focusFirstError = useFocusFirstError();
    // What the refused publish sent: a message stays only while the fields that answer it are unchanged.
    const [refused, setRefused] = useState<GameForm | null>(null);
    const errors = Object.fromEntries(
        Object.entries(form.errors as Record<string, string | undefined>).filter(
            ([key]) => refused === null || answeredBy(key).every((path) => JSON.stringify(valueAt(data, path)) === JSON.stringify(valueAt(refused, path))),
        ),
    ) as Record<string, string | undefined>;
    const onError = () => {
        setRefused(data);
        focusFirstError();
    };

    const published = game?.status === 'published' ? game : null;
    const keys = placeholders(data.rules);
    const groups = distance_groups.filter((group) => group.sg_category === data.sg_category);
    const offered = facilities.filter((facility) => category_facilities[data.sg_category].includes(facility.key));

    const same = (a: unknown, b: unknown) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
    const changes = published ? VERSIONED.filter(({ field }) => !same(data[field], saved[field])).map(({ label }) => label) : [];

    const action = !game ? 'Publish v1' : !published ? `Publish v${game.version}` : changes.length > 0 ? `Publish v${published.version + 1}` : `Save v${published.version}`;
    const note = !game
        ? 'A new Game publishes as v1 once it passes every publish check.'
        : !published
          ? `Publishes this Draft as v${game.version} once it passes every publish check.`
          : changes.length > 0
            ? `Changing the ${list(changes)} publishes v${published.version + 1}, replacing v${published.version} (published ${day(published.published_at!)}). Earlier scores stay, labelled v${published.version}.`
            : `Level settings, targets and everything under “Saved in place” save into v${published.version}, with no new version.`;

    const problems = Object.entries(errors)
        .filter((entry): entry is [string, string] => entry[1] !== undefined)
        .sort(([a], [b]) => rank(a) - rank(b));

    /** A field's message, or the first under it, such as `pad_values.2` for `pad_values`. */
    const errorFor = (field: string) => errors[field] ?? problems.find(([key]) => key.startsWith(`${field}.`))?.[1];

    const publish = () => {
        form.transform((form) => ({
            ...form,
            pad_values:
                form.score_entry === 'pad'
                    ? form.pad_values
                          .split(',')
                          .map((value) => value.trim())
                          .filter((value) => value !== '')
                          .map(Number)
                    : [],
            // Settings for placeholders the rules no longer use go.
            levels: form.levels.map((level) => ({ ...level, settings: Object.fromEntries(keys.map((key) => [key, level.settings[key] ?? ''])) })),
            source_concept: form.source_concept || null,
            source_url: form.source_url || null,
        }));
        if (game) {
            form.put(`/admin/games/${game.game_id}`, { onError });
        } else {
            form.post('/admin/games', { onError });
        }
    };

    const pickCategory = (category: SgCategory) => {
        // Facilities the new SG Category can't be played at go, with their features; distance groups belong to one SG Category.
        const kept = facilities.filter((facility) => data.facility_ids.includes(facility.id) && category_facilities[category].includes(facility.key));
        form.setData((data) => ({
            ...data,
            sg_category: category,
            facility_ids: kept.map((facility) => facility.id),
            feature_ids: data.feature_ids.filter((id) => kept.some((facility) => facility.features.some((feature) => feature.id === id))),
            distance_group_ids: data.distance_group_ids.filter((id) => distance_groups.some((group) => group.id === id && group.sg_category === category)),
        }));
    };

    const pickFacilities = (ids: string[]) => {
        // A feature only makes sense on a Facility the Game needs.
        const features = facilities.filter((facility) => ids.includes(facility.id)).flatMap((facility) => facility.features.map((feature) => feature.id));
        form.setData((data) => ({ ...data, facility_ids: ids, feature_ids: data.feature_ids.filter((id) => features.includes(id)) }));
    };

    const pickFeatures = (facility: FacilityData, ids: string[]) => {
        const own = facility.features.map((feature) => feature.id);
        form.setData('feature_ids', [...data.feature_ids.filter((id) => !own.includes(id)), ...ids]);
    };

    const setLevel = (index: number, change: Partial<LevelRow>) =>
        form.setData(
            'levels',
            data.levels.map((level, other) => (other === index ? { ...level, ...change } : level)),
        );

    return (
        <div className="flex flex-col gap-4">
            <Head title={game ? `Edit ${game.name}` : 'Add a Game'} />
            <AdminTabs />

            {/* aria: the browser doesn't block publishing, so the server's messages show under each field. */}
            <Form
                validationBehavior="aria"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    publish();
                }}
            >
                {/* The action stays in view: a bar above the form that sticks to the top as the admin scrolls. */}
                <div className="sticky top-0 z-20 -mt-2 bg-(--background) pt-2 md:-mt-4 md:pt-4">
                    <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)]">
                        <Button type="submit" size="lg" className="flex-1 sm:flex-none" isPending={form.processing}>
                            {action}
                        </Button>
                        <Link
                            href={game ? `/admin/catalogue?item=${game.id}` : '/admin/catalogue'}
                            className={buttonVariants({ variant: 'tertiary', size: 'lg', className: 'no-underline hover:no-underline' })}
                        >
                            Cancel
                        </Link>
                        <div className="min-w-60 flex-1 text-[13px]">
                            {problems.length > 0 && (
                                <span className="block font-bold text-danger">
                                    {problems.length} to fix: {problems[0][1]}
                                </span>
                            )}
                            <span className="block text-muted">{note}</span>
                        </div>
                    </div>
                </div>

                <Card>
                    <Card.Content className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <SgCategoryBadge category={sgCategoryKey(data.sg_category)} long />
                            <span className="rounded-full bg-surface-secondary px-3 py-1 text-[12px] font-bold">
                                {published ? `v${published.version} · published ${day(published.published_at!)}` : game ? `Draft v${game.version}` : 'New Game'}
                            </span>
                            {published && earlier_versions[0] && (
                                <span className="text-[12px] text-muted">
                                    v{published.version}, replaced v{earlier_versions[0].version} on {day(earlier_versions[0].replaced_at ?? published.published_at!)}
                                </span>
                            )}
                        </div>
                        <TextField isInvalid={'name' in errors} value={data.name} onChange={(value) => form.setData('name', value)} aria-label="Name">
                            <Input placeholder="Name the Game" className="h-auto py-2 text-[24px] font-extrabold" />
                            <FieldError>{errors.name}</FieldError>
                        </TextField>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header className="flex flex-row flex-wrap items-baseline justify-between gap-2">
                        <Card.Title>Levels</Card.Title>
                        {published && <span className="text-[12px] font-bold text-muted">Saved in place: no new version</span>}
                    </Card.Header>
                    <Card.Content>
                        <Levels
                            rules={data.rules}
                            keys={keys}
                            levels={data.levels}
                            errors={errors}
                            error={errors.levels}
                            onChange={setLevel}
                            onAdd={() => form.setData('levels', [1, 2, 3, 4, 5].map(() => ({ settings: {}, up: null, down: null })))}
                            onRemove={() => form.setData('levels', [])}
                        />
                    </Card.Content>
                </Card>

                <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                    <Card className="ring-2 ring-warning/60">
                        <Card.Header>
                            <Card.Title>{published ? `Changes here publish v${published.version + 1}` : 'Locked once published'}</Card.Title>
                            <Card.Description>
                                {published ? 'A new version keeps scores apart, so Proficiency never compares different Games.' : 'Changing any of these later publishes a new version.'}
                            </Card.Description>
                        </Card.Header>
                        <Card.Content className="flex flex-col gap-5">
                            <TextField isInvalid={'rules' in errors} value={data.rules} onChange={(value) => form.setData('rules', value)}>
                                <Label>Rules</Label>
                                <TextArea rows={4} />
                                <p className="text-[13px] text-muted">Put a Level’s setting in braces, such as {'{zone}'}: each Level gives it a value.</p>
                                <FieldError>{errors.rules}</FieldError>
                            </TextField>
                            <TextField isInvalid={'scoring' in errors} value={data.scoring} onChange={(value) => form.setData('scoring', value)}>
                                <Label>Scoring</Label>
                                <TextArea rows={2} />
                                <FieldError>{errors.scoring}</FieldError>
                            </TextField>
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Whole label="Balls" value={data.balls} isInvalid={'balls' in errors} onChange={(value) => form.setData('balls', value)} />
                                    <Whole
                                        label="Or estimated minutes"
                                        value={data.estimated_minutes}
                                        isInvalid={'balls' in errors || 'estimated_minutes' in errors}
                                        onChange={(value) => form.setData('estimated_minutes', value)}
                                    />
                                </div>
                                {(errors.balls || errors.estimated_minutes) && <p className={MESSAGE}>{errors.balls ?? errors.estimated_minutes}</p>}
                            </div>

                            <Section label="Facilities and features" error={errorFor('facility_ids') ?? errorFor('feature_ids')}>
                                <CheckboxGroup aria-label="Facilities" value={data.facility_ids} onChange={pickFacilities} className="flex flex-col gap-3">
                                    {offered.map((facility) => (
                                        <div key={facility.id} className="flex flex-col gap-2">
                                            <Tick value={facility.id} label={facility.name} />
                                            {data.facility_ids.includes(facility.id) && facility.features.length > 0 && (
                                                <CheckboxGroup
                                                    aria-label={`${facility.name} features`}
                                                    value={data.feature_ids.filter((id) => facility.features.some((feature) => feature.id === id))}
                                                    onChange={(ids) => pickFeatures(facility, ids)}
                                                    className="ms-7 flex flex-row flex-wrap gap-x-5 gap-y-2"
                                                >
                                                    {facility.features.map((feature) => (
                                                        <Tick key={feature.id} value={feature.id} label={feature.name} />
                                                    ))}
                                                </CheckboxGroup>
                                            )}
                                        </div>
                                    ))}
                                </CheckboxGroup>
                                <p className="text-[13px] text-muted">Only the Facilities its SG Category can be played at.</p>
                            </Section>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title>Saved in place</Card.Title>
                            <Card.Description>Changes here never publish a new version.</Card.Description>
                        </Card.Header>
                        <Card.Content className="flex flex-col gap-5">
                            <Section label="SG Category" error={errors.sg_category}>
                                {published ? (
                                    <>
                                        <SgCategoryBadge category={sgCategoryKey(data.sg_category)} long />
                                        <p className="text-[13px] text-muted">Fixed once published. For another SG Category, write a new Game.</p>
                                    </>
                                ) : (
                                    <ToggleButtonGroup
                                        aria-label="SG Category"
                                        selectionMode="single"
                                        disallowEmptySelection
                                        isDetached
                                        className="flex-wrap justify-start"
                                        selectedKeys={[data.sg_category]}
                                        onSelectionChange={(keys) => pickCategory([...keys][0] as SgCategory)}
                                    >
                                        {SG_CATEGORIES.map(({ category, label }) => (
                                            <ToggleButton key={category} id={category} className={`gap-2 ${SELECTED_SEGMENT}`}>
                                                <SgCategoryBadge category={sgCategoryKey(category)} />
                                                {label}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                )}
                            </Section>

                            <div className="flex flex-wrap items-start gap-6">
                                <Pick
                                    label="Better score"
                                    value={data.score_better}
                                    options={[
                                        ['higher', 'Higher'],
                                        ['lower', 'Lower'],
                                    ]}
                                    onChange={(value) => form.setData('score_better', value as ScoreBetter)}
                                />
                                <Pick
                                    label="Entered with"
                                    value={data.score_entry}
                                    options={[
                                        ['counter', 'Counter'],
                                        ['pad', 'Points pad'],
                                        ['timer', 'Timer'],
                                    ]}
                                    onChange={(value) => form.setData('score_entry', value as ScoreEntry)}
                                />
                            </div>
                            {data.score_entry === 'pad' && (
                                <TextField isInvalid={errorFor('pad_values') !== undefined} value={data.pad_values} onChange={(value) => form.setData('pad_values', value)}>
                                    <Label>Pad values</Label>
                                    <Input placeholder="0, 1, 2, 3" />
                                    <p className="text-[13px] text-muted">The points a golfer can tap, separated by commas.</p>
                                    <FieldError>{errorFor('pad_values')}</FieldError>
                                </TextField>
                            )}

                            {groups.length > 0 && (
                                <Section label="Distance groups" error={errorFor('distance_group_ids')}>
                                    <CheckboxGroup
                                        aria-label="Distance groups"
                                        value={data.distance_group_ids}
                                        onChange={(ids) => form.setData('distance_group_ids', ids)}
                                        className="flex flex-row flex-wrap gap-x-5 gap-y-2"
                                    >
                                        {groups.map((group) => (
                                            <Tick key={group.id} value={group.id} label={group.label} />
                                        ))}
                                    </CheckboxGroup>
                                </Section>
                            )}

                            <Whole
                                label="Seconds per ball"
                                description="Blank uses the Facility’s pace."
                                value={data.seconds_per_ball}
                                isInvalid={'seconds_per_ball' in errors}
                                error={errors.seconds_per_ball}
                                onChange={(value) => form.setData('seconds_per_ball', value)}
                            />

                            <OpenFields value={data.open} error={errorFor('open')} onChange={(open) => form.setData('open', open)} />

                            <TextField isInvalid={'source_concept' in errors} value={data.source_concept} onChange={(value) => form.setData('source_concept', value)}>
                                <Label>Source concept</Label>
                                <TextArea rows={2} />
                                <FieldError>{errors.source_concept}</FieldError>
                            </TextField>
                            <TextField type="url" isInvalid={'source_url' in errors} value={data.source_url} onChange={(value) => form.setData('source_url', value)}>
                                <Label>Source link</Label>
                                <Input />
                                <FieldError>{errors.source_url}</FieldError>
                            </TextField>
                        </Card.Content>
                    </Card>
                </div>
            </Form>
        </div>
    );
}

Game.layout = (props: Props) => ({ title: props.game ? 'Edit Game' : 'Add a Game' }) satisfies ShellProps;

const rank = (key: string) => {
    const index = FIELD_ORDER.findIndex((field) => key === field || key.startsWith(`${field}.`));
    return index === -1 ? FIELD_ORDER.length : index;
};

/** "rules, scoring and Facilities". */
function list(items: string[]): string {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
}

/**
 * The five Level rows: a column per rules placeholder, in the order the rules use them, then the up and
 * down targets and the rules as read at that Level (from tablet width, where there's room).
 */
function Levels(props: {
    rules: string;
    keys: string[];
    levels: LevelRow[];
    errors: Record<string, string | undefined>;
    error?: string;
    onChange: (index: number, change: Partial<LevelRow>) => void;
    onAdd: () => void;
    onRemove: () => void;
}) {
    const { rules, keys, levels, errors } = props;
    const rowErrors = (index: number) => Object.entries(errors).filter(([key, message]) => key.startsWith(`levels.${index}.`) && message !== undefined).map(([, message]) => message!);

    if (levels.length === 0) {
        return (
            <div className="flex flex-col items-start gap-3" data-has-error={props.error ? true : undefined}>
                <p className="text-[13px] text-muted">No Levels: the Game plays the same every time, and no Level moves.</p>
                <Button variant="secondary" size="sm" onPress={props.onAdd}>
                    Add Levels
                </Button>
                {props.error && <p className={MESSAGE}>{props.error}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* A plain table: a HeroUI Table is a grid that takes the arrow keys, so the caret couldn't move in its inputs. */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] border-separate border-spacing-y-1.5 text-[14px]">
                    <thead>
                        <tr className="text-left text-[13px] font-medium text-muted">
                            <th className="px-3 font-medium">Level</th>
                            {keys.map((key) => (
                                <th key={key} className="px-2 font-medium">{`{${key}}`}</th>
                            ))}
                            <th className="px-2 font-medium">Up at</th>
                            <th className="px-2 font-medium">Down at</th>
                            <th className="hidden px-3 font-medium md:table-cell">Reads as</th>
                        </tr>
                    </thead>
                    <tbody>
                        {levels.map((level, index) => (
                            <tr key={index} className="bg-surface-secondary [&>td:first-child]:rounded-s-[14px] [&>td:last-child]:rounded-e-[14px]">
                                <td className="px-3 py-2">
                                    <LevelMeter level={index + 1} />
                                </td>
                                {keys.map((key) => (
                                    <td key={key} className="px-2 py-2">
                                        <TextField
                                            aria-label={`Level ${index + 1} {${key}}`}
                                            isInvalid={`levels.${index}.settings.${key}` in errors}
                                            value={level.settings[key] ?? ''}
                                            onChange={(value) => props.onChange(index, { settings: { ...level.settings, [key]: value } })}
                                        >
                                            <Input className="w-full min-w-16 text-right tabular-nums" />
                                        </TextField>
                                    </td>
                                ))}
                                {(['up', 'down'] as const).map((target) => (
                                    <td key={target} className="w-28 px-2 py-2">
                                        <Whole
                                            label={`Level ${index + 1} ${target} target`}
                                            hideLabel
                                            allowNegative
                                            value={level[target]}
                                            isInvalid={`levels.${index}.${target}` in errors}
                                            onChange={(value) => props.onChange(index, { [target]: value })}
                                        />
                                    </td>
                                ))}
                                <td className="hidden max-w-md px-3 py-2 text-[13px] text-muted md:table-cell">{rulesAt(rules, level.settings)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {levels.some((_, index) => rowErrors(index).length > 0) && (
                <ul className="flex flex-col gap-0.5">
                    {levels.flatMap((_, index) => rowErrors(index)).map((message) => (
                        <li key={message} className={MESSAGE}>
                            {message}
                        </li>
                    ))}
                </ul>
            )}
            {props.error && (
                <p className={MESSAGE} data-has-error>
                    {props.error}
                </p>
            )}
            {keys.length === 0 && <p className="text-[13px] text-muted">The rules use no {'{placeholder}'}, so the Levels differ only by their targets.</p>}
            <Button variant="ghost" size="sm" className="self-start" onPress={props.onRemove}>
                Remove Levels
            </Button>
        </div>
    );
}

/** What a Variation may reword, such as target order. None means the Game has no Variations. */
function OpenFields({ value, error, onChange }: { value: string[]; error?: string; onChange: (open: string[]) => void }) {
    const [adding, setAdding] = useState('');
    const add = () => {
        const name = adding.trim();
        if (name && !value.includes(name)) {
            onChange([...value, name]);
        }
        setAdding('');
    };

    return (
        <Section label="Open fields" error={error}>
            <p className="text-[13px] text-muted">What a Variation may reword. None means the Game has no Variations.</p>
            {value.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {value.map((name) => (
                        <li key={name} className="flex items-center gap-1 rounded-full bg-surface-secondary py-1 ps-3 pe-1 text-[13px] font-medium">
                            {name}
                            <Button isIconOnly size="sm" variant="ghost" aria-label={`Remove ${name}`} className="size-6 min-w-6 rounded-full" onPress={() => onChange(value.filter((other) => other !== name))}>
                                ×
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex items-end gap-2">
                <TextField
                    aria-label="Add an Open field"
                    value={adding}
                    onChange={setAdding}
                    onKeyDown={(event) => {
                        // Enter adds the field rather than publishing the Game.
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            add();
                        }
                    }}
                    className="max-w-64 flex-1"
                >
                    <Input placeholder="Such as target order" />
                </TextField>
                <Button variant="secondary" onPress={add}>
                    Add
                </Button>
            </div>
        </Section>
    );
}

function Section({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2" data-has-error={error ? true : undefined}>
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <p className={MESSAGE}>{error}</p>}
        </div>
    );
}

function Tick({ value, label }: { value: string; label: string }) {
    return (
        <Checkbox value={value}>
            <Checkbox.Content>
                <Checkbox.Control>
                    <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{label}</Label>
            </Checkbox.Content>
        </Checkbox>
    );
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{label}</span>
            <ToggleButtonGroup
                aria-label={label}
                selectionMode="single"
                disallowEmptySelection
                className="w-max rounded-full bg-surface-secondary p-1"
                selectedKeys={[value]}
                onSelectionChange={(keys) => onChange(String([...keys][0]))}
            >
                {options.map(([id, text]) => (
                    <ToggleButton key={id} id={id} className={SELECTED_SEGMENT}>
                        {text}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </div>
    );
}

function Whole(props: {
    label: string;
    value: number | null;
    isInvalid: boolean;
    onChange: (value: number | null) => void;
    hideLabel?: boolean;
    allowNegative?: boolean;
    description?: string;
    error?: string;
}) {
    return (
        <NumberField
            minValue={props.allowNegative ? undefined : 1}
            step={1}
            aria-label={props.hideLabel ? props.label : undefined}
            isInvalid={props.isInvalid}
            formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
            value={props.value ?? Number.NaN}
            onChange={(value) => props.onChange(Number.isNaN(value) ? null : value)}
        >
            {!props.hideLabel && <Label>{props.label}</Label>}
            <NumberField.Group>
                <NumberField.Input className="text-right tabular-nums" />
            </NumberField.Group>
            {props.description && <p className="text-[13px] text-muted">{props.description}</p>}
            {props.error && <FieldError>{props.error}</FieldError>}
        </NumberField>
    );
}
