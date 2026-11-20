# TrendChart

The four small Strokes Gained charts (Recharts 3 on web), one per SG Category, with linked hover.

- Card per category: badge + name, the shown Rounds' average (Last 5 or Last 10) in `stat` with `sgTone`, the last 20 Rounds' average smaller.
- A toggle beside the Baseline picker shows the last 5 (default) or 10 Rounds.
- Each shown Round's own value: a dot (3px radius, 1.5px in the small cards) joined by a 3px line in the category colour. Last 20 average: a flat 2px dashed `chart-bar` line. Zero line: 1.5px solid `muted`. Grid: dashed `separator`.
- Clicking a chart shows no focus ring; keyboard focus does.
- Hover: dashed vertical marker across all four charts, a dot with a 3px ring in `surface`, a Tooltip beside the pointer with the Round's signed value, date, course, score and holes.
- All four share one y-scale (+2 to −4) so heights compare across categories. Only Rounds with the same Baseline are plotted.
- Colours come from CSS variables (`stroke="var(--cat-app)"`), so charts follow the theme.
