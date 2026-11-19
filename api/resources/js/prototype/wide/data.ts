// PROTOTYPE (#50) — fake data for the wide-screen variants. Wipe me.

export type CatKey = 'ott' | 'app' | 'shg' | 'put';

export const CATS: { key: CatKey; code: string; name: string }[] = [
    { key: 'ott', code: 'OTT', name: 'Off the Tee' },
    { key: 'app', code: 'APP', name: 'Approach' },
    { key: 'shg', code: 'SHG', name: 'Short Game' },
    { key: 'put', code: 'PUT', name: 'Putting' },
];

export type Round = {
    id: number;
    date: string;
    course: string;
    holes: 9 | 18;
    score: number;
    baseline: string;
    sg: Record<CatKey, number>;
};

const courses = ['Royal Cape', 'Steenberg', 'Westlake', 'Atlantic Beach', 'Milnerton', 'Clovelly'];
const r = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
};
const sg = (seed: number, bias: number) => Math.round((r(seed) * 3 - 1.5 + bias) * 100) / 100;

export const rounds: Round[] = Array.from({ length: 25 }, (_, i) => {
    const day = new Date(2026, 10, 18 - i * 4);
    return {
        id: 25 - i,
        date: day.toISOString().slice(0, 10),
        course: courses[i % courses.length],
        holes: i % 5 === 3 ? 9 : 18,
        score: i % 5 === 3 ? 41 + (i % 4) : 79 + ((i * 7) % 9),
        baseline: 'Scratch',
        sg: { ott: sg(i + 1, 0.2), app: sg(i + 31, -0.6), shg: sg(i + 61, 0.1), put: sg(i + 91, -0.3) },
    };
});

export const total = (round: Round) => CATS.reduce((sum, c) => sum + round.sg[c.key], 0);

/** Rolling averages, oldest first, for the trend lines. */
export function rolling(cat: CatKey, window: number): number[] {
    const oldestFirst = [...rounds].reverse();
    return oldestFirst.map((_, i) => {
        const slice = oldestFirst.slice(Math.max(0, i - window + 1), i + 1);
        return slice.reduce((s, x) => s + x.sg[cat], 0) / slice.length;
    });
}

export const last = (xs: number[]) => xs[xs.length - 1];

export const approachBands = ['50–75', '75–100', '100–125', '125–150', '150–175', '175–200', '200+'].map((b) => `${b} m`);
export const puttingBands = [
    ...Array.from({ length: 10 }, (_, i) => `${i}–${i + 1} m`),
    '10+ m',
];

export const week = [
    { day: 'Mon', label: 'Range · 45 min', done: true },
    { day: 'Tue', label: '', done: false },
    { day: 'Wed', label: 'Putting green · 30 min', done: true },
    { day: 'Thu', label: 'Short game area · 40 min', done: false, today: true },
    { day: 'Fri', label: '', done: false },
    { day: 'Sat', label: 'Round', done: false },
    { day: 'Sun', label: 'Range · 60 min', done: false },
];

export type Game = {
    id: string;
    name: string;
    cat: CatKey;
    kind: 'Game' | 'Drill';
    status: 'published' | 'draft' | 'retired';
    version: number;
    facilities: string[];
    minutes: number;
    origin?: string;
    rules: string;
};

export const games: Game[] = [
    { id: 'g1', name: 'Fairway Finder', cat: 'ott', kind: 'Game', status: 'published', version: 2, facilities: ['Range'], minutes: 20, rules: 'Pick two targets 30 m apart as a fairway. Hit 10 drives; score 1 per ball that finishes inside.' },
    { id: 'g2', name: 'Ladder 100–150', cat: 'app', kind: 'Game', status: 'published', version: 3, facilities: ['Range'], minutes: 25, rules: 'Climb from 100 m to 150 m in 10 m steps. Two balls per rung; move up when one finishes within 8 m.' },
    { id: 'g3', name: 'Par 18', cat: 'shg', kind: 'Game', status: 'published', version: 1, facilities: ['Short game area'], minutes: 30, rules: 'Nine chips and nine pitches, each holed out. Par is 2 per hole.' },
    { id: 'g4', name: 'Clock Drill', cat: 'put', kind: 'Drill', status: 'published', version: 1, facilities: ['Putting green'], minutes: 15, rules: 'Eight balls in a circle at 1 m around the hole. Hole all eight to move out to 1.5 m.' },
    { id: 'g5', name: 'Lag to the Fringe', cat: 'put', kind: 'Game', status: 'published', version: 1, facilities: ['Putting green'], minutes: 20, rules: 'Ten putts from 10 m+. Score 2 inside a putter length, 1 inside two.' },
    { id: 'g6', name: 'Up and Down 9', cat: 'shg', kind: 'Game', status: 'draft', version: 1, facilities: ['Short game area'], minutes: 25, origin: 'LLM', rules: 'Nine lies around the green, each played to the hole. Score the up and downs.' },
    { id: 'g7', name: 'Wedge Window', cat: 'app', kind: 'Game', status: 'draft', version: 4, facilities: ['Range'], minutes: 20, origin: 'first load', rules: 'Hit 50, 65 and 80 m, three balls each, into a 6 m window.' },
    { id: 'g8', name: 'Draw / Fade', cat: 'ott', kind: 'Game', status: 'retired', version: 2, facilities: ['Range'], minutes: 20, rules: 'Alternate a draw and a fade on every ball.' },
    { id: 'g9', name: 'Gate Drill', cat: 'put', kind: 'Drill', status: 'published', version: 1, facilities: ['Putting green'], minutes: 10, rules: 'Two tees just wider than the putter head. Twenty strokes through the gate.' },
];
