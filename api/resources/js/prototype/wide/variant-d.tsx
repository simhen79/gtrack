// PROTOTYPE (#50) — Variant D: the mix picked after reviewing A, B and C.
//   Home: A. Enter a Round: C. Rounds: B's list + detail, list grouped by month as in C.
//   Trends: A's 2×2 grid, each chart expandable into B's detail. Catalogue: A's summary and
//   Drafts row over B's list + detail.

import { useState } from 'react';
import { CATS, type CatKey, games, last, rolling, rounds, total } from './data';
import { Cat, catalogue, drafts, fmtDate, Ghost, Label, Legend, Panel, Primary, Sg, StatusChip, Tile, TrendLines } from './parts';
import { pages as A } from './variant-a';
import { Row, Split } from './variant-b';
import { pages as C } from './variant-c';

function RoundsPage() {
    const [id, setId] = useState(rounds[0].id);
    const r = rounds.find((x) => x.id === id)!;
    const byMonth = rounds.reduce<Record<string, typeof rounds>>((acc, x) => {
        const m = new Date(`${x.date}T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        (acc[m] ??= []).push(x);
        return acc;
    }, {});
    return (
        <Split
            list={Object.entries(byMonth).map(([m, rs]) => (
                <div key={m} className="flex flex-col gap-1">
                    <p className="sticky top-0 z-10 bg-surface px-4 pt-3 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">{m}</p>
                    {rs.map((x) => (
                        <Row key={x.id} active={x.id === id} onClick={() => setId(x.id)}>
                            <span>
                                <span className="block font-bold">{x.course}</span>
                                <span className="text-[13px] opacity-70">
                                    {fmtDate(x.date)} · {x.holes} holes · {x.score}
                                </span>
                            </span>
                            <Sg n={total(x)} />
                        </Row>
                    ))}
                </div>
            ))}
            detail={
                <div className="flex max-w-4xl flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[13px] text-muted">
                                {fmtDate(r.date)} · {r.holes} holes · {r.baseline}
                            </p>
                            <h2 className="text-[28px] font-extrabold">{r.course}</h2>
                        </div>
                        <div className="text-right">
                            <Sg n={total(r)} className="text-[48px] leading-none" />
                            <p className="text-[13px] text-muted">Score {r.score}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {CATS.map((c) => (
                            <Tile key={c.key}>
                                <Cat k={c.key} long />
                                <Sg n={r.sg[c.key]} className="mt-2 block text-[28px]" />
                            </Tile>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <Tile>
                            <Label>Fairways</Label>
                            <p className="text-[20px] font-extrabold">8 / 14</p>
                        </Tile>
                        <Tile>
                            <Label>Approach miss</Label>
                            <p className="text-[20px] font-extrabold">Short 31%</p>
                        </Tile>
                        <Tile>
                            <Label>Up and downs</Label>
                            <p className="text-[20px] font-extrabold">3 / 7</p>
                        </Tile>
                    </div>
                    <div className="flex gap-2">
                        <Ghost>Edit Round</Ghost>
                        <Ghost className="text-danger">Delete</Ghost>
                    </div>
                </div>
            }
        />
    );
}

const BANDS: Partial<Record<CatKey, { label: string; v: number }[]>> = {
    app: ['50–75', '75–100', '100–125', '125–150', '150–175', '175–200', '200+'].map((label, i) => ({
        label,
        v: [-0.2, -0.1, 0.05, -0.3, -0.45, -0.25, -0.5][i],
    })),
    put: ['0–1', '1–2', '2–3', '3–4', '4–5', '5–6', '6–7', '7–8', '8–9', '9–10', '10+'].map((label, i) => ({
        label,
        v: [0.1, 0.05, -0.1, -0.2, -0.05, 0.02, -0.15, -0.1, 0, -0.05, -0.2][i],
    })),
};

function Numbers({ cat, big = false }: { cat: CatKey; big?: boolean }) {
    const size = big ? 'text-[32px]' : '';
    return (
        <span className={`flex ${big ? 'gap-8 text-right' : 'gap-4 text-[13px]'}`}>
            {[5, 20].map((w) => (
                <span key={w} className={big ? 'flex flex-col' : ''}>
                    <span className="text-muted">Last {w} </span>
                    <Sg n={last(rolling(cat, w))} className={size} />
                </span>
            ))}
        </span>
    );
}

function Trends() {
    const [open, setOpen] = useState<CatKey | null>(null);
    const toolbar = (
        <div className="flex items-center justify-between lg:col-span-12">
            <div className="flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                {['Scratch', 'Handicap 10'].map((b, i) => (
                    <span key={b} className={`rounded-[10px] px-3 py-1.5 text-[13px] font-bold ${i === 0 ? 'bg-segment text-segment-foreground' : ''}`}>
                        {b}
                    </span>
                ))}
            </div>
            <Legend />
        </div>
    );
    const expand = (k: CatKey) => (
        <Ghost className="h-8" onClick={() => setOpen(open === k ? null : k)}>
            {open === k ? 'Collapse' : 'Expand'}
        </Ghost>
    );

    if (!open) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {toolbar}
                {CATS.map((c) => (
                    <Panel key={c.key} className="lg:col-span-6" title={<Cat k={c.key} long />} action={<span className="flex items-center gap-4"><Numbers cat={c.key} />{expand(c.key)}</span>}>
                        <TrendLines cat={c.key} height={180} axis />
                    </Panel>
                ))}
            </div>
        );
    }

    const c = CATS.find((x) => x.key === open)!;
    const bands = BANDS[open];
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {toolbar}
            <Panel className="lg:col-span-12" title={<Cat k={open} />} action={expand(open)}>
                <div className="mb-4 flex items-end justify-between">
                    <h2 className="text-[28px] font-extrabold">{c.name}</h2>
                    <Numbers cat={open} big />
                </div>
                <TrendLines cat={open} height={300} axis />
                {bands && (
                    <div className="mt-6">
                        <Label>By distance band, last 20 Rounds</Label>
                        <div className="mt-3 flex h-40 items-end gap-2">
                            {bands.map((b) => (
                                <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                                    <Sg n={b.v} className="text-[12px]" />
                                    <div className={`w-full rounded-t-[6px] ${b.v < 0 ? 'bg-sg-negative' : 'bg-sg-positive'}`} style={{ height: `${Math.max(4, Math.abs(b.v) * 180)}px` }} />
                                    <span className="text-[11px] text-muted">{b.label} m</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Panel>
            {CATS.filter((x) => x.key !== open).map((x) => (
                <Panel key={x.key} className="lg:col-span-4" title={<Cat k={x.key} long />} action={expand(x.key)}>
                    <Numbers cat={x.key} />
                    <div className="mt-3">
                        <TrendLines cat={x.key} height={70} />
                    </div>
                </Panel>
            ))}
        </div>
    );
}

function Catalogue() {
    const [filter, setFilter] = useState<'published' | 'retired'>('published');
    const list = catalogue.filter((g) => g.status === filter);
    const [id, setId] = useState<string>(list[0].id);
    const g = games.find((x) => x.id === id) ?? list[0];
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <Panel className="lg:col-span-3">
                    <Label>Published</Label>
                    <p className="text-[32px] font-extrabold">{catalogue.filter((x) => x.status === 'published').length}</p>
                    <Label>Retired</Label>
                    <p className="text-[20px] font-extrabold">{catalogue.filter((x) => x.status === 'retired').length}</p>
                </Panel>
                <Panel className="lg:col-span-9" title={`Drafts waiting (${drafts.length})`} action={<Primary className="h-10">Draft a Game</Primary>}>
                    <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                        {drafts.map((x) => (
                            <li key={x.id}>
                                <button type="button" onClick={() => setId(x.id)} className={`flex w-full flex-col gap-2 rounded-[18px] p-4 text-left ${x.id === g.id ? 'outline-2 outline-accent' : ''} bg-surface-secondary`}>
                                    <span className="flex items-center gap-2">
                                        <Cat k={x.cat} /> <b>{x.name}</b>
                                        <span className="text-[12px] text-muted">
                                            v{x.version} · {x.origin}
                                        </span>
                                    </span>
                                    <span className="line-clamp-1 text-[13px] text-muted">{x.rules}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>
            <Split
                list={
                    <>
                        <div className="m-2 flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                            {(['published', 'retired'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => {
                                        setFilter(f);
                                        setId(catalogue.find((x) => x.status === f)!.id);
                                    }}
                                    className={`flex-1 rounded-[10px] px-2 py-1.5 text-[13px] font-bold capitalize ${filter === f ? 'bg-surface text-foreground' : ''}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <input placeholder="Search the Catalogue" className="mx-2 mb-2 h-10 rounded-[12px] border border-field-border bg-field-background px-3 text-[14px] outline-none" />
                        {list.map((x) => (
                            <Row key={x.id} active={x.id === g.id} onClick={() => setId(x.id)}>
                                <span className="flex items-center gap-2">
                                    <Cat k={x.cat} /> <b>{x.name}</b>
                                </span>
                                <span className="text-[12px] opacity-70">{x.kind}</span>
                            </Row>
                        ))}
                    </>
                }
                detail={
                    <div className="flex max-w-3xl flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="flex items-center gap-2">
                                    <Cat k={g.cat} long /> <StatusChip status={g.status} /> <span className="text-[13px] text-muted">v{g.version}</span>
                                </span>
                                <h2 className="mt-2 text-[28px] font-extrabold">{g.name}</h2>
                            </div>
                            <div className="flex gap-2">
                                {g.status === 'draft' ? (
                                    <>
                                        <Ghost className="text-danger">Delete</Ghost>
                                        <Primary className="h-10">Approve</Primary>
                                    </>
                                ) : (
                                    <>
                                        <Ghost>Edit</Ghost>
                                        {g.status === 'published' && <Ghost className="text-danger">Retire</Ghost>}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Tile>
                                <Label>Facilities</Label>
                                <p className="font-bold">{g.facilities.join(', ')}</p>
                            </Tile>
                            <Tile>
                                <Label>Time</Label>
                                <p className="font-bold">{g.minutes} min</p>
                            </Tile>
                            <Tile>
                                <Label>Origin</Label>
                                <p className="font-bold">{g.origin ?? 'hand-written'}</p>
                            </Tile>
                        </div>
                        <div>
                            <Label>Rules</Label>
                            <p className="mt-1 text-[15px] leading-relaxed">{g.rules}</p>
                        </div>
                    </div>
                }
            />
        </div>
    );
}

export const name = 'Chosen';
export const pages = { home: A.home, round: C.round, rounds: RoundsPage, trends: Trends, catalogue: Catalogue };
