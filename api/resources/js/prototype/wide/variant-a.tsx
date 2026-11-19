// PROTOTYPE (#50) — Variant A: Bento grid. Every page is a 12-column grid of cards that fills
// whatever width there is; cards span columns by importance and stack to one column on a phone.

import { useState } from 'react';
import { CATS, last, rolling, rounds, total } from './data';
import {
    BandGrid,
    Cat,
    catalogue,
    drafts,
    Field,
    fmtDate,
    Ghost,
    Label,
    Legend,
    MissCross,
    Panel,
    Primary,
    Sg,
    StatusChip,
    Tile,
    TrendLines,
    WeekStrip,
} from './parts';

const grid = 'grid grid-cols-1 gap-4 lg:grid-cols-12';

function Home() {
    const last5 = rounds.slice(0, 5);
    const avg = last5.reduce((s, r) => s + total(r), 0) / 5;
    return (
        <div className={grid}>
            <Panel className="lg:col-span-4" title="Strokes Gained, last 5 Rounds">
                <Sg n={avg} className="text-[48px] leading-none" />
                <p className="mt-2 text-[13px] text-muted">per 18, against Scratch</p>
            </Panel>
            {CATS.map((c) => (
                <Panel key={c.key} className="lg:col-span-2" title={<Cat k={c.key} />}>
                    <Sg n={last(rolling(c.key, 5))} className="text-[28px]" />
                    <div className="mt-3">
                        <TrendLines cat={c.key} height={48} />
                    </div>
                </Panel>
            ))}
            <Panel className="lg:col-span-8" title="This week" action={<span className="text-[13px] text-muted">3 of 5 planned</span>}>
                <WeekStrip />
            </Panel>
            <Panel className="flex flex-col lg:col-span-4" title="Next Practice Session">
                <p className="font-bold">Thursday · Short game area · 40 min</p>
                <p className="mt-1 text-[13px] text-muted">Par 18, Up and Down 9 and a putting Drill</p>
                <p className="mt-3 text-[13px] text-muted">Picked for your Short Game, your weakest SG Category this month.</p>
                <Primary className="mt-auto w-full">Start Practice Session</Primary>
            </Panel>
            <Panel className="lg:col-span-7" title="Recent Rounds" action={<a className="text-[13px] font-bold underline">All Rounds</a>}>
                <ul className="flex flex-col gap-1.5">
                    {rounds.slice(0, 4).map((r) => (
                        <li key={r.id}>
                            <Tile className="flex items-center justify-between py-3">
                                <span>
                                    <b>{r.course}</b> <span className="text-[13px] text-muted">· {fmtDate(r.date)} · {r.score}</span>
                                </span>
                                <Sg n={total(r)} />
                            </Tile>
                        </li>
                    ))}
                </ul>
            </Panel>
            <Panel className="lg:col-span-5" title="Where you lose strokes">
                <div className="flex flex-col gap-3">
                    {CATS.map((c) => {
                        const v = last(rolling(c.key, 20));
                        return (
                            <div key={c.key} className="flex items-center gap-3">
                                <span className="w-12">
                                    <Cat k={c.key} />
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-surface-tertiary">
                                    <div className={`h-2 rounded-full ${v < 0 ? 'bg-sg-negative' : 'bg-sg-positive'}`} style={{ width: `${Math.min(100, Math.abs(v) * 80)}%` }} />
                                </div>
                                <Sg n={v} className="w-14 text-right text-[14px]" />
                            </div>
                        );
                    })}
                </div>
            </Panel>
        </div>
    );
}

function RoundEntry() {
    const [open, setOpen] = useState(true);
    return (
        <div className={grid}>
            <Panel className="lg:col-span-5" title="Strokes Gained">
                <div className="grid grid-cols-2 gap-3">
                    <Field sg label="Off the Tee" value="+0.45" />
                    <Field sg locked label="Approach (from bands)" value="−0.60" />
                    <Field sg label="Short Game" value="+0.12" />
                    <Field sg locked label="Putting (from bands)" value="−0.38" />
                </div>
                <Tile className="mt-4 flex items-center justify-between">
                    <Label>Total</Label>
                    <Sg n={-0.41} className="text-[32px]" />
                </Tile>
            </Panel>
            <Panel className="lg:col-span-4" title="Round">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date" value="18 Nov 2026" className="col-span-2" />
                    <Field label="Course" value="Royal Cape" className="col-span-2" />
                    <Field label="Holes" value="18" />
                    <Field label="Score" value="81" />
                    <Field label="Baseline" value="Scratch" />
                    <Field label="Course Handicap" value="6" />
                </div>
            </Panel>
            <Panel className="flex flex-col lg:col-span-3" title="Save">
                <p className="text-[13px] text-muted">Royal Cape · 18 holes · 81</p>
                <p className="mt-1 text-[13px] text-muted">Advanced stats: 3 of 4 SG Categories</p>
                <Primary className="mt-auto w-full">Save Round</Primary>
                <p className="mt-2 text-center text-[12px] text-muted">Tab moves between fields · ⌘↵ saves</p>
            </Panel>
            <Panel
                className="lg:col-span-12"
                title="Advanced stats"
                action={
                    <Ghost className="h-8" onClick={() => setOpen(!open)}>
                        {open ? 'Fold away' : 'Open'}
                    </Ghost>
                }
            >
                {open && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="flex flex-col gap-3 lg:col-span-3">
                            <Cat k="ott" long />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fairways" value="8" suffix="of 14" className="col-span-2" />
                                <Field label="Missed left" value="4" />
                                <Field label="Missed right" value="2" />
                                <Field label="Penalties" value="1" />
                            </div>
                            <Cat k="shg" long />
                            <Field label="Up and downs" value="3" suffix="of 7" />
                        </div>
                        <div className="flex flex-col gap-3 lg:col-span-4">
                            <Cat k="app" long />
                            <MissCross />
                            <Label>Strokes Gained by distance</Label>
                            <BandGrid cat="app" cols="grid-cols-4" />
                        </div>
                        <div className="flex flex-col gap-3 lg:col-span-5">
                            <Cat k="put" long />
                            <Label>Strokes Gained by distance</Label>
                            <BandGrid cat="put" cols="grid-cols-4 xl:grid-cols-6" />
                        </div>
                    </div>
                )}
            </Panel>
        </div>
    );
}

function RoundsPage() {
    const [openId, setOpenId] = useState<number | null>(rounds[1].id);
    const avg = rounds.slice(0, 5).reduce((s, r) => s + total(r), 0) / 5;
    return (
        <div className={grid}>
            {[
                ['Rounds', String(rounds.length)],
                ['Average score, last 5', '82.4'],
            ].map(([l, v]) => (
                <Panel key={l} className="lg:col-span-3">
                    <Label>{l}</Label>
                    <p className="mt-1 text-[32px] font-extrabold">{v}</p>
                </Panel>
            ))}
            <Panel className="lg:col-span-3">
                <Label>SG, last 5</Label>
                <Sg n={avg} className="mt-1 block text-[32px]" />
            </Panel>
            <Panel className="lg:col-span-3">
                <Label>Best Round</Label>
                <p className="mt-1 text-[32px] font-extrabold">76</p>
            </Panel>
            <Panel className="lg:col-span-12" title="All Rounds">
                <div className="grid grid-cols-[110px_1fr_60px_60px_repeat(4,70px)_80px] gap-x-3 px-4 pb-2 text-[12px] font-bold text-muted">
                    <span>Date</span>
                    <span>Course</span>
                    <span>Holes</span>
                    <span>Score</span>
                    {CATS.map((c) => (
                        <span key={c.key} className="text-right">
                            {c.code}
                        </span>
                    ))}
                    <span className="text-right">Total</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                    {rounds.slice(0, 10).map((r) => (
                        <li key={r.id}>
                            <button
                                type="button"
                                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                                className="grid w-full grid-cols-[110px_1fr_60px_60px_repeat(4,70px)_80px] items-center gap-x-3 rounded-[18px] bg-surface-secondary px-4 py-3 text-left"
                            >
                                <span className="text-[14px]">{fmtDate(r.date)}</span>
                                <span className="font-bold">{r.course}</span>
                                <span>{r.holes}</span>
                                <span>{r.score}</span>
                                {CATS.map((c) => (
                                    <Sg key={c.key} n={r.sg[c.key]} className="text-right text-[14px]" />
                                ))}
                                <Sg n={total(r)} className="text-right" />
                            </button>
                            {openId === r.id && (
                                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
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
                                    <Tile className="flex items-center justify-end">
                                        <Ghost>Edit Round</Ghost>
                                    </Tile>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </Panel>
        </div>
    );
}

function Trends() {
    return (
        <div className={grid}>
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
            {CATS.map((c) => (
                <Panel
                    key={c.key}
                    className="lg:col-span-6"
                    title={<Cat k={c.key} long />}
                    action={
                        <span className="flex gap-4 text-[13px]">
                            <span>
                                <span className="text-muted">Last 5 </span>
                                <Sg n={last(rolling(c.key, 5))} />
                            </span>
                            <span>
                                <span className="text-muted">Last 20 </span>
                                <Sg n={last(rolling(c.key, 20))} />
                            </span>
                        </span>
                    }
                >
                    <TrendLines cat={c.key} height={180} axis />
                </Panel>
            ))}
        </div>
    );
}

function Catalogue() {
    const [tab, setTab] = useState<'all' | 'Game' | 'Drill'>('all');
    const list = catalogue.filter((g) => tab === 'all' || g.kind === tab);
    return (
        <div className={grid}>
            <Panel className="lg:col-span-4">
                <Label>Published</Label>
                <p className="text-[32px] font-extrabold">{catalogue.filter((g) => g.status === 'published').length}</p>
                <Label>Retired</Label>
                <p className="text-[20px] font-extrabold">{catalogue.filter((g) => g.status === 'retired').length}</p>
            </Panel>
            <Panel className="lg:col-span-8" title={`Drafts waiting (${drafts.length})`} action={<Primary className="h-10">Draft a Game</Primary>}>
                <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {drafts.map((g) => (
                        <li key={g.id}>
                            <Tile className="flex flex-col gap-2">
                                <span className="flex items-center gap-2">
                                    <Cat k={g.cat} /> <b>{g.name}</b> <span className="text-[12px] text-muted">v{g.version} · {g.origin}</span>
                                </span>
                                <span className="line-clamp-2 text-[13px] text-muted">{g.rules}</span>
                                <span className="flex gap-2">
                                    <Ghost className="h-8">Approve</Ghost>
                                    <Ghost className="h-8 text-danger">Delete</Ghost>
                                </span>
                            </Tile>
                        </li>
                    ))}
                </ul>
            </Panel>
            <Panel
                className="lg:col-span-12"
                title="Catalogue"
                action={
                    <div className="flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                        {(['all', 'Game', 'Drill'] as const).map((t) => (
                            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-[10px] px-3 py-1.5 text-[13px] font-bold ${tab === t ? 'bg-segment text-segment-foreground' : ''}`}>
                                {t === 'all' ? 'All' : `${t}s`}
                            </button>
                        ))}
                    </div>
                }
            >
                <ul className="flex flex-col gap-1.5">
                    {list.map((g) => (
                        <li key={g.id} className="grid grid-cols-[60px_1fr_80px_1fr_80px_100px_40px] items-center gap-3 rounded-[18px] bg-surface-secondary px-4 py-3">
                            <Cat k={g.cat} />
                            <b>{g.name}</b>
                            <span className="text-[13px] text-muted">{g.kind}</span>
                            <span className="text-[13px] text-muted">{g.facilities.join(', ')}</span>
                            <span className="text-[13px] text-muted">{g.minutes} min</span>
                            <StatusChip status={g.status === 'published' ? `v${g.version}` : g.status} />
                            <span className="text-muted">···</span>
                        </li>
                    ))}
                </ul>
            </Panel>
        </div>
    );
}

export const name = 'Bento grid';
export const pages = { home: Home, round: RoundEntry, rounds: RoundsPage, trends: Trends, catalogue: Catalogue };
