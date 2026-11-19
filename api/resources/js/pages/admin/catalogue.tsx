import { Alert, AlertDialog, Button, buttonVariants, Chip, Link, SearchField, Tabs } from '@heroui/react';
import type { DistanceGroupData, DrillData, FacilityData, GameOrigin, GameStatus, GameVersionData, ScoreEntry } from '@gtrack/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { AdminTabs } from '../../components/admin-tabs';
import { SgCategoryBadge, sgCategoryKey } from '../../components/sg-category';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';
import type { SharedProps } from '../../types';

type Props = {
    games: GameVersionData[];
    drafts: GameVersionData[];
    drills: DrillData[];
    facilities: FacilityData[];
    distance_groups: DistanceGroupData[];
};

/** A row in the list or the Drafts: a Game version or a Drill, with the status the admin sees. */
type Item = { kind: 'Game'; id: string; status: GameStatus; game: GameVersionData } | { kind: 'Drill'; id: string; status: GameStatus; drill: DrillData };

type Filter = 'published' | 'retired';

/** From here the list sits beside the selected item's detail. */
const WIDE = '(min-width: 64rem)';

const ORIGINS: Record<GameOrigin, string> = { llm: 'LLM', hand_written: 'Hand-written', first_load: 'First load' };

const ENTRIES: Record<ScoreEntry, string> = { counter: 'Counter', pad: 'Points pad', timer: 'Timer' };

const STATUS_COLOURS = { draft: 'warning', published: 'success', retired: 'default' } as const;

/**
 * The Catalogue: counts and Drafts waiting over a list of Games and Drills beside the
 * selected one. A Draft opens in the same detail pane, with Approve and Delete.
 */
export default function Catalogue({ games, drafts, drills, facilities, distance_groups }: Props) {
    const wide = useMediaQuery(WIDE);
    const items: Item[] = [
        ...games.map((game): Item => ({ kind: 'Game', id: game.id, status: game.status, game })),
        ...drills.map((drill): Item => ({ kind: 'Drill', id: drill.id, status: drill.retired_at ? 'retired' : 'published', drill })),
    ].sort((a, b) => name(a).localeCompare(name(b)));
    const draftItems = drafts.map((game): Item => ({ kind: 'Game', id: game.id, status: 'draft', game }));

    // After Approve, Retire or a saved Drill the server sends `?item=` to keep that item open.
    const { url } = usePage();
    const [selectedId, setSelectedId] = useState(() => itemIn(url));
    const [visited, setVisited] = useState(url);
    if (url !== visited) {
        setVisited(url);
        setSelectedId(itemIn(url));
    }
    const selected = [...draftItems, ...items].find((item) => item.id === selectedId);
    const [filter, setFilter] = useState<Filter>(selected?.status === 'retired' ? 'retired' : 'published');
    const [search, setSearch] = useState('');

    // Retiring keeps the item selected, so the list follows it to Retired.
    const [listedStatus, setListedStatus] = useState(selected?.status);
    if (selected?.status !== listedStatus) {
        setListedStatus(selected?.status);
        if (selected && selected.status !== 'draft') {
            setFilter(selected.status);
        }
    }

    const listed = items.filter((item) => item.status === filter && name(item).toLowerCase().includes(search.trim().toLowerCase()));
    const shown = selected ?? listed[0];
    const count = (status: GameStatus) => items.filter((item) => item.status === status).length;

    const list = (
        <div className="flex flex-col gap-2">
            <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(key as Filter)}>
                <Tabs.ListContainer>
                    <Tabs.List aria-label="Show" className="w-full">
                        {(['published', 'retired'] as const).map((status) => (
                            <Tabs.Tab key={status} id={status} className="flex-1 capitalize">
                                {status}
                                <Tabs.Indicator />
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>
            <SearchField aria-label="Search the Catalogue" value={search} onChange={setSearch}>
                <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search the Catalogue" />
                    <SearchField.ClearButton />
                </SearchField.Group>
            </SearchField>
            {listed.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-muted">{search ? 'Nothing matches.' : `Nothing ${filter} yet.`}</p>
            ) : (
                <ul className="flex flex-col gap-1">
                    {listed.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                aria-current={item.id === shown?.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left ${
                                    item.id === shown?.id ? 'bg-segment text-segment-foreground' : 'hover:bg-surface-secondary'
                                }`}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <SgCategoryBadge category={sgCategoryKey(category(item))} />
                                    <span className="truncate font-bold">{name(item)}</span>
                                </span>
                                <span className="text-[12px] opacity-70">{item.kind}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const detail = shown ? (
        <Detail key={shown.id} item={shown} facilities={facilities} distanceGroups={distance_groups} />
    ) : (
        <p className="text-muted">Nothing in the Catalogue yet. Approve a Draft or add a Drill.</p>
    );

    return (
        <div className="flex flex-col gap-4">
            <Head title="Catalogue" />
            <AdminTabs />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section className="flex flex-col gap-3 rounded-[24px] bg-surface p-6 lg:col-span-3">
                    <div className="flex gap-8 lg:flex-col lg:gap-3">
                        <div>
                            <p className="text-[13px] font-bold text-muted">Published</p>
                            <p className="text-[32px] font-extrabold tabular-nums">{count('published')}</p>
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-muted">Retired</p>
                            <p className="text-[20px] font-extrabold tabular-nums">{count('retired')}</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/drills/create"
                        className={buttonVariants({ variant: 'secondary', className: 'mt-auto no-underline hover:no-underline' })}
                    >
                        Add a Drill
                    </Link>
                </section>

                <section className="rounded-[24px] bg-surface p-6 lg:col-span-9">
                    <h2 className="mb-4 text-[18px] font-bold">Drafts waiting ({draftItems.length})</h2>
                    {draftItems.length === 0 ? (
                        <p className="text-[13px] text-muted">No Drafts waiting.</p>
                    ) : (
                        <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                            {draftItems.map((item) => (
                                <li key={item.id}>
                                    <DraftCard draft={(item as Extract<Item, { kind: 'Game' }>).game} selected={item.id === shown?.id} onSelect={() => setSelectedId(item.id)} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {wide ? (
                <div className="grid h-[calc(100vh-140px)] grid-cols-[360px_1fr] gap-4">
                    <div className="overflow-y-auto rounded-[24px] bg-surface p-3">{list}</div>
                    <div className="overflow-y-auto rounded-[24px] bg-surface p-7">{detail}</div>
                </div>
            ) : (
                <>
                    <div className="rounded-[24px] bg-surface p-3">{list}</div>
                    <div className="rounded-[24px] bg-surface p-5">{detail}</div>
                </>
            )}
        </div>
    );
}

Catalogue.layout = { title: 'Catalogue' } satisfies ShellProps;

const itemIn = (url: string) => new URLSearchParams(url.split('?')[1] ?? '').get('item');

const name = (item: Item) => (item.kind === 'Game' ? item.game.name : item.drill.name);
const category = (item: Item) => (item.kind === 'Game' ? item.game.sg_category : item.drill.sg_category);

function DraftCard({ draft, selected, onSelect }: { draft: GameVersionData; selected: boolean; onSelect: () => void }) {
    return (
        <button
            type="button"
            aria-current={selected}
            onClick={onSelect}
            className={`flex w-full flex-col gap-2 rounded-[18px] bg-surface-secondary p-4 text-left ${selected ? 'outline-2 outline-accent' : ''}`}
        >
            <span className="flex items-center gap-2">
                <SgCategoryBadge category={sgCategoryKey(draft.sg_category)} />
                <b>{draft.name}</b>
                <span className="text-[12px] text-muted">
                    v{draft.version} · {ORIGINS[draft.origin]}
                </span>
            </span>
            <span className="line-clamp-1 text-[13px] text-muted">{draft.rules}</span>
        </button>
    );
}

function Detail({ item, facilities, distanceGroups }: { item: Item; facilities: FacilityData[]; distanceGroups: DistanceGroupData[] }) {
    const { errors } = usePage<SharedProps>().props;
    const shape = item.kind === 'Game' ? item.game : item.drill;
    const facilityNames = facilities.filter((facility) => shape.facility_ids.includes(facility.id)).map((facility) => facility.name);
    const featureNames = facilities.flatMap((facility) =>
        facility.features.filter((feature) => shape.feature_ids.includes(feature.id)).map((feature) => `${feature.name} (${facility.name.toLowerCase()})`),
    );
    const groupLabels = distanceGroups.filter((group) => shape.distance_group_ids.includes(group.id)).map((group) => group.label);

    return (
        <div className="flex max-w-3xl flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <span className="flex items-center gap-2">
                        <SgCategoryBadge category={sgCategoryKey(shape.sg_category)} long />
                        <Chip size="sm" color={STATUS_COLOURS[item.status]} className="capitalize">
                            {item.status === 'draft' ? 'Draft' : item.status}
                        </Chip>
                        {item.kind === 'Game' && <span className="text-[13px] text-muted">v{item.game.version}</span>}
                    </span>
                    <h2 className="mt-2 text-[28px] font-extrabold">{shape.name}</h2>
                    <p className="text-[13px] text-muted">{item.kind}</p>
                </div>
                <Actions item={item} />
            </div>

            {errors.approve && (
                <Alert status="danger">
                    <Alert.Content>
                        <Alert.Title>{errors.approve}</Alert.Title>
                    </Alert.Content>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile label="Facilities">{facilityNames.join(', ') || 'None'}</Tile>
                <Tile label="Time">{shape.balls ? `${shape.balls} balls` : `${shape.estimated_minutes} min`}</Tile>
                {item.kind === 'Game' ? <Tile label="Origin">{ORIGINS[item.game.origin]}</Tile> : <Tile label="Distance groups">{groupLabels.join(', ') || 'Any'}</Tile>}
                {featureNames.length > 0 && <Tile label="Features">{featureNames.join(', ')}</Tile>}
                {item.kind === 'Game' && groupLabels.length > 0 && <Tile label="Distance groups">{groupLabels.join(', ')}</Tile>}
                {item.kind === 'Game' && (
                    <Tile label="Score">
                        {item.game.score_better === 'higher' ? 'Higher' : 'Lower'} is better · {ENTRIES[item.game.score_entry]}
                    </Tile>
                )}
            </div>

            {item.kind === 'Game' ? (
                <>
                    <Text label="Rules">{item.game.rules}</Text>
                    <Text label="Scoring">{item.game.scoring}</Text>
                </>
            ) : (
                <Text label="Setup">{item.drill.setup}</Text>
            )}
            {(shape.source_concept || shape.source_url) && (
                <Text label="Source">
                    {shape.source_concept}{' '}
                    {shape.source_url && (
                        <Link href={shape.source_url} target="_blank" rel="noreferrer">
                            {shape.source_url}
                        </Link>
                    )}
                </Text>
            )}
        </div>
    );
}

/** A Draft is approved or deleted; a published Game or Drill is retired; a Drill is edited in place. */
function Actions({ item }: { item: Item }) {
    const [approving, setApproving] = useState(false);
    const done = { preserveScroll: true };

    if (item.status === 'draft') {
        return (
            <div className="flex gap-2">
                <Confirm
                    trigger="Delete"
                    heading={`Delete the Draft “${name(item)}”?`}
                    body="It’s removed for good. This can’t be undone."
                    confirm="Delete Draft"
                    onConfirm={(options) => router.delete(`/admin/drafts/${item.id}`, { ...done, ...options })}
                />
                <Button
                    isPending={approving}
                    onPress={() =>
                        router.post(`/admin/drafts/${item.id}/approve`, {}, { ...done, onStart: () => setApproving(true), onFinish: () => setApproving(false) })
                    }
                >
                    Approve
                </Button>
            </div>
        );
    }

    const retireUrl = item.kind === 'Game' ? `/admin/games/${item.game.game_id}/retire` : `/admin/drills/${item.id}/retire`;

    return (
        <div className="flex gap-2">
            {item.kind === 'Drill' && (
                <Link href={`/admin/drills/${item.id}/edit`} className={buttonVariants({ variant: 'tertiary', className: 'no-underline hover:no-underline' })}>
                    Edit
                </Link>
            )}
            {item.status === 'published' && (
                <Confirm
                    trigger="Retire"
                    heading={`Retire “${name(item)}”?`}
                    body={
                        item.kind === 'Game'
                            ? 'It leaves the Catalogue, so no new Practice Session includes it. Its scores and record are kept.'
                            : 'It leaves the Catalogue, so no new Practice Session includes it. Its record is kept.'
                    }
                    confirm={`Retire ${item.kind}`}
                    onConfirm={(options) => router.post(retireUrl, {}, { ...done, ...options })}
                />
            )}
        </div>
    );
}

type VisitOptions = { onStart: () => void; onFinish: () => void };

/** A danger button that asks first, in an AlertDialog whose confirm repeats the verb. */
function Confirm(props: { trigger: string; heading: string; body: string; confirm: string; onConfirm: (options: VisitOptions) => void }) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);

    return (
        <AlertDialog isOpen={open} onOpenChange={setOpen}>
            <Button variant="danger-soft">{props.trigger}</Button>
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[420px]">
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="danger" />
                            <AlertDialog.Heading>{props.heading}</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="text-muted">{props.body}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot="close" variant="tertiary">
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                isPending={pending}
                                onPress={() =>
                                    props.onConfirm({
                                        onStart: () => setPending(true),
                                        onFinish: () => {
                                            setPending(false);
                                            setOpen(false);
                                        },
                                    })
                                }
                            >
                                {props.confirm}
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    );
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-[18px] bg-surface-secondary p-4">
            <p className="text-[13px] font-bold text-muted">{label}</p>
            <p className="font-bold">{children}</p>
        </div>
    );
}

function Text({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="text-[13px] font-bold text-muted">{label}</p>
            <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line">{children}</p>
        </div>
    );
}
