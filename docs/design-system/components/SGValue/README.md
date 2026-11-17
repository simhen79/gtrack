# SGValue

How every Strokes Gained number is shown.

- Always `formatSG(n)`: a sign, two decimals, true minus (−). Tabular figures, weight 800.
- Colour from `sgTone(n)`: `sg-positive`, `sg-negative`, `sg-zero`. Colour backs up the sign; it is never the only signal.
- Say what it's measured against nearby: "vs Scratch", "Last 5", "per 18 holes".
- Deltas (this Round vs last 5) add ▲/▼ before the signed value.
- Sizes: `stat-xl` headline, `stat` cards and inputs, `stat-sm` lists.
