// sg.ts — shared by web and phone (put it in a shared package or copy it)
export const SG_CATEGORIES = [
  { key: 'ott', code: 'OTT', name: 'Off the Tee', color: 'cat-ott' },
  { key: 'app', code: 'APP', name: 'Approach', color: 'cat-app' },
  { key: 'shg', code: 'SHG', name: 'Short Game', color: 'cat-shg' },
  { key: 'put', code: 'PUT', name: 'Putting', color: 'cat-put' },
] as const;

export const formatSG = (n: number) =>
  Math.abs(n) < 0.005 ? '0.00' : (n > 0 ? '+' : '\u2212') + Math.abs(n).toFixed(2);

export const sgTone = (n: number) =>
  Math.abs(n) < 0.005 ? 'text-sg-zero' : n > 0 ? 'text-sg-positive' : 'text-sg-negative';

export const parseSG = (s: string) => {
  const n = parseFloat(s.replace('\u2212', '-').replace('+', ''));
  return Number.isFinite(n) ? n : null;
};
