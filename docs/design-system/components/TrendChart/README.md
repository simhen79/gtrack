# TrendChart

The four small Strokes Gained charts (Recharts 3 on web), one per SG Category, with linked hover.

- Card per category: badge + name, Last 5 in `stat` with `sgTone`, Last 20 smaller.
- Last 5 rolling: 3px line in the category colour. Last 20: 2px dashed `chart-bar`. Zero line: 1.5px solid `muted`. Grid: dashed `separator`.
- Hover: dashed vertical marker across all four charts, a dot with a 3px ring in `surface`, white Tooltip above with the signed value.
- All four share one y-scale (+2 to −4) so heights compare across categories. Only Rounds with the same Baseline are plotted.
- Colours come from CSS variables (`stroke="var(--cat-app)"`), so charts follow the theme.
