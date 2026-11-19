// PROTOTYPE (#50) — Variant C: Focused column + side rail. Content keeps a readable width
// (~760px) however wide the screen; a sticky rail on the right carries context, totals and the
// page's one action. On a phone the rail drops under the column (layout C stays the phone shape).

import { useState, type ReactNode } from 'react';
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
    Primary,
    Sg,
    StatusChip,
    Tile,
    TrendLines,
    WeekStrip,
} from './parts';

function Columns({ main, rail }: { main: ReactNode; rail: ReactNode }) {
    return (
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
            <div className="flex w-full max-w-[760px] flex-col gap-8">{main}</div>
            <aside className="flex w-full flex-col gap-4 xl:sticky xl:top-8 xl:w-[320px]">{rail}</aside>
        </div>
    );
}

function Section({ n, title, children }: { n?: number; title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-3 text-[20px] font-extrabold">
                {n && <span className="flex size-7 items-center justify-center rounded-full bg-surface-secondary text-[13px]">{n}</span>}
                {title}
            </h2>
            {children}
        </section>
    );
}

function RailCard({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`rounded-[24px] bg-surface p-5 ${className}`}>{children}</div>;
}

function CategoryBars() {
    return (
        <div className="flex flex-col gap-2.5">
            {CATS.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                    <Cat k={c.key} long />
                    <Sg n={last(rolling(c.key, 5))} className="text-[15px]" />
                </div>
            ))}
        </div>
    );
}

function Home() {
    return (
        <Columns
            main={
                <>
                    <div className="rounded-[24px] bg-surface p-8">
                        <p className="text-[13px] font-bold text-muted">Today · Thursday</p>
                        <h2 className="mt-1 text-[32px] leading-tight font-extrabold">Short game area, 40 min</h2>
                        <div className="mt-5 flex flex-col gap-2">
                            {[
                                ['shg', 'Par 18', '15 min'],
                                ['shg', 'Up and Down 9', '15 min'],
                                ['put', 'Clock Drill', '10 min'],
                            ].map(([k, n, m]) => (
                                <Tile key={n} className="flex items-center gap-3 py-3">
                                    <Cat k={k as 'shg'} /> <b>{n}</b> <span className="ml-auto text-[13px] text-muted">{m}</span>
                                </Tile>
                            ))}
                        </div>
                        <Primary className="mt-6">Start Practice Session</Primary>
                    </div>
                    <Section title="This week">
                        <WeekStrip />
                    </Section>
                    <Section title="Latest Round">
                        <Tile className="flex items-center justify-between p-5">
                            <span>
                                <b className="text-[17px]">{rounds[0].course}</b>
                                <span className="block text-[13px] text-muted">
                                    {fmtDate(rounds[0].date)} · {rounds[0].holes} holes · {rounds[0].score}
                                </span>
                            </span>
                            <Sg n={total(rounds[0])} className="text-[32px]" />
                        </Tile>
                    </Section>
                </>
            }
            rail={
                <>
                    <RailCard>
                        <Label>Strokes Gained, last 5</Label>
                        <Sg n={-0.62} className="mt-1 mb-4 block text-[40px] leading-none" />
                        <CategoryBars />
                    </RailCard>
                    <RailCard>
                        <Label>Focus</Label>
                        <p className="mt-1 font-bold">Approach from 150 m+</p>
                        <p className="text-[13px] text-muted">Your lowest distance group over the last 20 Rounds.</p>
                    </RailCard>
                </>
            }
        />
    );
}

function RoundEntry() {
    const [open, setOpen] = useState(false);
    return (
        <Columns
            main={
                <>
                    <Section n={1} title="Strokes Gained">
                        <div className="grid grid-cols-2 gap-4">
                            <Field sg label="Off the Tee" value="+0.45" />
                            <Field sg label="Approach" value="−0.60" />
                            <Field sg label="Short Game" value="+0.12" />
                            <Field sg label="Putting" value="−0.38" />
                        </div>
                    </Section>
                    <Section n={2} title="Score">
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Score" value="81" />
                            <Field label="Holes" value="18" />
                            <Field label="Course Handicap" value="6" />
                        </div>
                    </Section>
                    <Section n={3} title="Details">
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Date" value="18 Nov 2026" />
                            <Field label="Course" value="Royal Cape" />
                            <Field label="Baseline" value="Scratch" />
                        </div>
                    </Section>
                    <section className="rounded-[24px] bg-surface">
                        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-5 text-left">
                            <span>
                                <span className="text-[18px] font-bold">Advanced stats</span>
                                <span className="block text-[13px] text-muted">Optional. Fairways, misses, up and downs, and SG by distance band.</span>
                            </span>
                            <span className="text-[20px]">{open ? '−' : '+'}</span>
                        </button>
                        {open && (
                            <div className="flex flex-col gap-6 px-6 pb-6">
                                <div className="flex flex-col gap-3">
                                    <Cat k="ott" long />
                                    <div className="grid grid-cols-4 gap-3">
                                        <Field label="Fairways" value="8" suffix="/14" />
                                        <Field label="Left" value="4" />
                                        <Field label="Right" value="2" />
                                        <Field label="Penalties" value="1" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Cat k="app" long />
                                    <div className="flex gap-6">
                                        <MissCross />
                                        <div className="flex-1">
                                            <BandGrid cat="app" cols="grid-cols-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Cat k="shg" long />
                                    <Field label="Up and downs" value="3" suffix="of 7" className="w-48" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Cat k="put" long />
                                    <BandGrid cat="put" cols="grid-cols-6" />
                                </div>
                            </div>
                        )}
                    </section>
                </>
            }
            rail={
                <RailCard className="flex flex-col gap-4">
                    <div>
                        <Label>Total Strokes Gained</Label>
                        <Sg n={-0.41} className="text-[48px] leading-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                        {CATS.map((c, i) => (
                            <div key={c.key} className="flex items-center justify-between">
                                <Cat k={c.key} long />
                                <Sg n={[0.45, -0.6, 0.12, -0.38][i]} className="text-[15px]" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[13px] text-muted">Royal Cape · 18 holes · 81</p>
                    <Primary className="w-full">Save Round</Primary>
                    <p className="text-center text-[12px] text-muted">⌘↵ saves</p>
                </RailCard>
            }
        />
    );
}

function RoundsPage() {
    const [openId, setOpenId] = useState<number | null>(null);
    const byMonth = rounds.reduce<Record<string, typeof rounds>>((acc, r) => {
        const m = new Date(`${r.date}T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        (acc[m] ??= []).push(r);
        return acc;
    }, {});
    return (
        <Columns
            main={Object.entries(byMonth).map(([m, rs]) => (
                <Section key={m} title={m}>
                    <ul className="flex flex-col gap-1.5">
                        {rs.map((r) => (
                            <li key={r.id}>
                                <button type="button" onClick={() => setOpenId(openId === r.id ? null : r.id)} className="flex w-full items-center gap-4 rounded-[18px] bg-surface px-5 py-4 text-left">
                                    <span className="w-14 text-[13px] text-muted">{fmtDate(r.date)}</span>
                                    <span className="flex-1">
                                        <b>{r.course}</b> <span className="text-[13px] text-muted">· {r.holes} holes · {r.score}</span>
                                    </span>
                                    <Sg n={total(r)} className="text-[20px]" />
                                </button>
                                {openId === r.id && (
                                    <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                                        {CATS.map((c) => (
                                            <Tile key={c.key}>
                                                <Cat k={c.key} />
                                                <Sg n={r.sg[c.key]} className="mt-1 block text-[20px]" />
                                            </Tile>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            ))}
            rail={
                <>
                    <RailCard>
                        <Label>Last 5 Rounds</Label>
                        <Sg n={-0.62} className="mt-1 mb-4 block text-[40px] leading-none" />
                        <CategoryBars />
                    </RailCard>
                    <RailCard className="flex flex-col gap-3">
                        <Label>Show</Label>
                        <Field value="All Baselines" />
                        <Field value="9 and 18 holes" />
                    </RailCard>
                </>
            }
        />
    );
}

function Trends() {
    return (
        <Columns
            main={CATS.map((c) => (
                <section key={c.key} className="rounded-[24px] bg-surface p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <Cat k={c.key} long />
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
                    </div>
                    <TrendLines cat={c.key} height={140} axis />
                </section>
            ))}
            rail={
                <>
                    <RailCard className="flex flex-col gap-3">
                        <Label>Baseline</Label>
                        <div className="flex flex-col gap-1">
                            {['Scratch', 'Handicap 10'].map((b, i) => (
                                <span key={b} className={`rounded-[12px] px-3 py-2 text-[14px] font-bold ${i === 0 ? 'bg-segment text-segment-foreground' : 'bg-surface-secondary'}`}>
                                    {b}
                                </span>
                            ))}
                        </div>
                        <Legend />
                    </RailCard>
                    <RailCard>
                        <Label>What this shows</Label>
                        <p className="mt-1 text-[13px] text-muted">Rolling averages per 18 holes. 9-hole Rounds count double. Only Rounds on the chosen Baseline.</p>
                    </RailCard>
                </>
            }
        />
    );
}

function Catalogue() {
    return (
        <Columns
            main={CATS.map((c) => {
                const items = catalogue.filter((g) => g.cat === c.key);
                return (
                    <Section key={c.key} title={c.name}>
                        <ul className="flex flex-col gap-1.5">
                            {items.map((g) => (
                                <li key={g.id} className="flex items-center gap-4 rounded-[18px] bg-surface px-5 py-4">
                                    <span className="flex-1">
                                        <b>{g.name}</b>{' '}
                                        <span className="text-[13px] text-muted">
                                            · {g.kind} · {g.facilities.join(', ')} · {g.minutes} min
                                        </span>
                                    </span>
                                    <StatusChip status={g.status === 'published' ? `v${g.version}` : g.status} />
                                    <span className="text-muted">···</span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                );
            })}
            rail={
                <>
                    <RailCard className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label>Drafts waiting</Label>
                            <span className="rounded-full bg-accent px-2 text-[12px] font-extrabold text-accent-foreground">{drafts.length}</span>
                        </div>
                        {drafts.map((g) => (
                            <Tile key={g.id} className="flex flex-col gap-2">
                                <span className="flex items-center gap-2">
                                    <Cat k={g.cat} /> <b className="text-[14px]">{g.name}</b>
                                </span>
                                <span className="text-[12px] text-muted">
                                    v{g.version} · {g.origin}
                                </span>
                                <span className="flex gap-2">
                                    <Ghost className="h-8 flex-1">Approve</Ghost>
                                    <Ghost className="h-8 text-danger">Delete</Ghost>
                                </span>
                            </Tile>
                        ))}
                    </RailCard>
                    <Primary className="w-full">Draft a Game</Primary>
                </>
            }
        />
    );
}

export const name = 'Focused column + side rail';
export const pages = { home: Home, round: RoundEntry, rounds: RoundsPage, trends: Trends, catalogue: Catalogue };
