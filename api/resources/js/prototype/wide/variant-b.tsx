// PROTOTYPE (#50) — Variant B: List + detail. Every page is two panes: a scrolling list on the
// left (~360px) and the selected item in full on the right. Width goes to the detail; on a phone
// the list is the page and the detail opens over it.

import { useState, type ReactNode } from 'react';
import { CATS, type CatKey, games, last, rolling, rounds, total, week } from './data';
import {
    BandGrid,
    Cat,
    Field,
    fmtDate,
    Ghost,
    Keypad,
    Label,
    Legend,
    MissCross,
    Primary,
    Sg,
    StatusChip,
    Tile,
    TrendLines,
} from './parts';

export function Split({ list, detail }: { list: ReactNode; detail: ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-140px)] lg:grid-cols-[360px_1fr]">
            <div className="flex flex-col gap-1.5 overflow-y-auto rounded-[24px] bg-surface p-3">{list}</div>
            <div className="overflow-y-auto rounded-[24px] bg-surface p-7">{detail}</div>
        </div>
    );
}

export function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left ${active ? 'bg-segment text-segment-foreground' : 'hover:bg-surface-secondary'}`}
        >
            {children}
        </button>
    );
}

function Home() {
    const [day, setDay] = useState('Thu');
    const d = week.find((w) => w.day === day)!;
    return (
        <Split
            list={
                <>
                    <p className="px-4 pt-2 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">This week</p>
                    {week.map((w) => (
                        <Row key={w.day} active={w.day === day} onClick={() => setDay(w.day)}>
                            <span>
                                <b>{w.day}</b> <span className="text-[13px] opacity-70">{w.label || 'Rest'}</span>
                            </span>
                            {w.done ? <span className="size-2 rounded-full bg-success" /> : w.today ? <span className="text-[11px] font-extrabold">TODAY</span> : null}
                        </Row>
                    ))}
                    <p className="px-4 pt-4 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">Recent Rounds</p>
                    {rounds.slice(0, 3).map((r) => (
                        <Row key={r.id} active={false} onClick={() => {}}>
                            <span className="text-[14px]">
                                {r.course} <span className="text-muted">· {fmtDate(r.date)}</span>
                            </span>
                            <Sg n={total(r)} className="text-[14px]" />
                        </Row>
                    ))}
                </>
            }
            detail={
                <div className="flex max-w-3xl flex-col gap-6">
                    <div className="grid grid-cols-4 gap-3">
                        {CATS.map((c) => (
                            <Tile key={c.key}>
                                <Cat k={c.key} />
                                <Sg n={last(rolling(c.key, 5))} className="mt-2 block text-[24px]" />
                                <p className="text-[12px] text-muted">last 5</p>
                            </Tile>
                        ))}
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-muted">{day === 'Thu' ? 'Today' : day}</p>
                        <h2 className="text-[28px] font-extrabold">{d.label || 'Nothing planned'}</h2>
                    </div>
                    {d.label && (
                        <div className="flex flex-col gap-2">
                            {[
                                ['shg', 'Par 18', '18 balls · 15 min'],
                                ['shg', 'Up and Down 9', '9 lies · 15 min'],
                                ['put', 'Clock Drill', '8 balls · 10 min'],
                            ].map(([k, n, m]) => (
                                <Tile key={n} className="flex items-center gap-3">
                                    <Cat k={k as CatKey} /> <b>{n}</b> <span className="ml-auto text-[13px] text-muted">{m}</span>
                                </Tile>
                            ))}
                            <p className="text-[13px] text-muted">Picked for your Short Game, your weakest SG Category this month.</p>
                            <Primary className="mt-2 w-max">Start Practice Session</Primary>
                        </div>
                    )}
                </div>
            }
        />
    );
}

function RoundEntry() {
    const [tab, setTab] = useState<'basics' | 'advanced'>('basics');
    return (
        <Split
            list={
                <>
                    <p className="px-4 pt-2 pb-1 text-[11px] font-extrabold tracking-widest text-muted uppercase">Copy details from</p>
                    {rounds.slice(0, 8).map((r, i) => (
                        <Row key={r.id} active={i === 0} onClick={() => {}}>
                            <span className="text-[14px]">
                                <b>{r.course}</b> <span className="opacity-70">· {fmtDate(r.date)}</span>
                            </span>
                            <span className="text-[13px] opacity-70">{r.holes} holes</span>
                        </Row>
                    ))}
                </>
            }
            detail={
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                            {(['basics', 'advanced'] as const).map((t) => (
                                <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-[10px] px-4 py-1.5 text-[14px] font-bold ${tab === t ? 'bg-segment text-segment-foreground' : ''}`}>
                                    {t === 'basics' ? 'Strokes Gained and Score' : 'Advanced stats'}
                                </button>
                            ))}
                        </div>
                        <Primary>Save Round</Primary>
                    </div>
                    {tab === 'basics' ? (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-baseline justify-between">
                                    <Label>Royal Cape · 18 Nov · 18 holes · Scratch</Label>
                                    <Sg n={-0.41} className="text-[40px]" />
                                </div>
                                {CATS.map((c, i) => (
                                    <div key={c.key} className={`flex items-center justify-between rounded-[14px] px-4 py-3 ${i === 1 ? 'outline-2 outline-accent' : 'bg-surface-secondary'}`}>
                                        <span className="flex items-center gap-3">
                                            <Cat k={c.key} /> {c.name}
                                        </span>
                                        <span className="text-[22px] font-extrabold tabular-nums">{['+0.45', '−0.6', '—', '—'][i]}</span>
                                    </div>
                                ))}
                                <div className="grid grid-cols-3 gap-3">
                                    <Field label="Score" value="81" />
                                    <Field label="Course Handicap" value="6" />
                                    <Field label="Date" value="18 Nov" />
                                </div>
                            </div>
                            <Keypad />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                            <div className="flex flex-col gap-3">
                                <Cat k="ott" long />
                                <div className="grid grid-cols-4 gap-3">
                                    <Field label="Fairways" value="8/14" />
                                    <Field label="Left" value="4" />
                                    <Field label="Right" value="2" />
                                    <Field label="Penalties" value="1" />
                                </div>
                                <Cat k="app" long />
                                <MissCross />
                                <BandGrid cat="app" cols="grid-cols-4" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Cat k="shg" long />
                                <Field label="Up and downs" value="3 of 7" className="w-40" />
                                <Cat k="put" long />
                                <BandGrid cat="put" cols="grid-cols-4" />
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    );
}

function RoundsPage() {
    const [id, setId] = useState(rounds[0].id);
    const r = rounds.find((x) => x.id === id)!;
    return (
        <Split
            list={rounds.map((x) => (
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

function Trends() {
    const [cat, setCat] = useState<CatKey>('app');
    const c = CATS.find((x) => x.key === cat)!;
    return (
        <Split
            list={
                <>
                    <div className="m-2 flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                        {['Scratch', 'Handicap 10'].map((b, i) => (
                            <span key={b} className={`flex-1 rounded-[10px] px-3 py-1.5 text-center text-[13px] font-bold ${i === 0 ? 'bg-surface text-foreground' : ''}`}>
                                {b}
                            </span>
                        ))}
                    </div>
                    {CATS.map((x) => (
                        <Row key={x.key} active={x.key === cat} onClick={() => setCat(x.key)}>
                            <span className="flex w-full flex-col gap-2">
                                <span className="flex items-center justify-between">
                                    <Cat k={x.key} long />
                                    <Sg n={last(rolling(x.key, 5))} />
                                </span>
                                <TrendLines cat={x.key} height={36} />
                            </span>
                        </Row>
                    ))}
                </>
            }
            detail={
                <div className="flex flex-col gap-5">
                    <div className="flex items-end justify-between">
                        <div>
                            <Cat k={cat} />
                            <h2 className="mt-2 text-[28px] font-extrabold">{c.name}</h2>
                        </div>
                        <div className="flex gap-8 text-right">
                            <div>
                                <Label>Last 5</Label>
                                <Sg n={last(rolling(cat, 5))} className="text-[32px]" />
                            </div>
                            <div>
                                <Label>Last 20</Label>
                                <Sg n={last(rolling(cat, 20))} className="text-[32px]" />
                            </div>
                        </div>
                    </div>
                    <TrendLines cat={cat} height={320} axis />
                    <Legend />
                    {(cat === 'app' || cat === 'put') && (
                        <div>
                            <Label>By distance band, last 20</Label>
                            <div className="mt-3 flex h-32 items-end gap-2">
                                {(cat === 'app' ? [-0.2, -0.1, 0.05, -0.3, -0.45, -0.25, -0.5] : [0.1, 0.05, -0.1, -0.2, -0.05, 0.02, -0.15, -0.1, 0, -0.05, -0.2]).map((v, i) => (
                                    <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                                        <div className={`w-full rounded-t-[6px] ${v < 0 ? 'bg-sg-negative' : 'bg-sg-positive'}`} style={{ height: `${Math.abs(v) * 200}px` }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    );
}

function Catalogue() {
    const [filter, setFilter] = useState<'published' | 'draft' | 'retired'>('draft');
    const list = games.filter((g) => g.status === filter);
    const [id, setId] = useState<string | undefined>(list[0]?.id);
    const g = games.find((x) => x.id === id) ?? list[0];
    return (
        <Split
            list={
                <>
                    <div className="m-2 flex gap-1 rounded-[12px] bg-surface-secondary p-1">
                        {(['published', 'draft', 'retired'] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => {
                                    setFilter(f);
                                    setId(games.find((x) => x.status === f)?.id);
                                }}
                                className={`flex-1 rounded-[10px] px-2 py-1.5 text-[13px] font-bold capitalize ${filter === f ? 'bg-surface text-foreground' : ''}`}
                            >
                                {f === 'draft' ? `Drafts (${games.filter((x) => x.status === 'draft').length})` : f}
                            </button>
                        ))}
                    </div>
                    <input placeholder="Search the Catalogue" className="mx-2 mb-2 h-10 rounded-[12px] border border-field-border bg-field-background px-3 text-[14px] outline-none" />
                    {list.map((x) => (
                        <Row key={x.id} active={x.id === g?.id} onClick={() => setId(x.id)}>
                            <span className="flex items-center gap-2">
                                <Cat k={x.cat} /> <b>{x.name}</b>
                            </span>
                            <span className="text-[12px] opacity-70">{x.kind}</span>
                        </Row>
                    ))}
                </>
            }
            detail={
                g && (
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
                        <div>
                            <Label>Versions</Label>
                            <div className="mt-2 flex flex-col gap-1.5">
                                {Array.from({ length: g.version }, (_, i) => g.version - i).map((v) => (
                                    <Tile key={v} className="flex justify-between py-2.5 text-[14px]">
                                        <span>v{v}</span>
                                        <span className="text-muted">{v === g.version ? g.status : 'superseded'}</span>
                                    </Tile>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        />
    );
}

export const name = 'List + detail';
export const pages = { home: Home, round: RoundEntry, rounds: RoundsPage, trends: Trends, catalogue: Catalogue };
