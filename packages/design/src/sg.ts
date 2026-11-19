// From docs/design-system/code/sg.ts: Strokes Gained helpers shared by web and phone.
export const SG_CATEGORIES = [
  { key: 'ott', code: 'OTT', name: 'Off the Tee', color: 'cat-ott' },
  { key: 'app', code: 'APP', name: 'Approach', color: 'cat-app' },
  { key: 'shg', code: 'SHG', name: 'Short Game', color: 'cat-shg' },
  { key: 'put', code: 'PUT', name: 'Putting', color: 'cat-put' },
] as const;

/** Always a sign (a true minus, U+2212) and two decimals: "+1.05", "0.00", "−2.10". */
export const formatSG = (n: number) =>
  Math.abs(n) < 0.005 ? '0.00' : (n > 0 ? '+' : '−') + Math.abs(n).toFixed(2);

export const sgTone = (n: number) =>
  Math.abs(n) < 0.005 ? 'text-sg-zero' : n > 0 ? 'text-sg-positive' : 'text-sg-negative';

export const parseSG = (s: string) => {
  const n = parseFloat(s.replace('−', '-').replace('+', ''));
  return Number.isFinite(n) ? n : null;
};
