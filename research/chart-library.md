# Chart library for the web trend charts

Researched 2026-11-10. Web only: mobile charts are out of scope. No app was built or run. A throwaway npm project was installed with `--ignore-scripts` to read package source and to bundle a minimal line chart per library with esbuild, and nothing was rendered in a browser. `[S#]` markers refer to the source table at the end. Claims marked **Inference** are my reasoning from the sources, not something a source states.

The chart: rolling 5 and 20 Round averages of Strokes Gained for each SG Category (Off the Tee, Approach, Short Game, Putting). Values have two decimals and can be negative, so the chart needs a zero line.

## Recommended setup

**Verdict: Recharts 3.10.1.** It is the only candidate that is SVG, React-native in its API, actively released, accepts React 19 in its peers, and has a documented CSS-variable theming route that matches HeroUI's light and dark switch without a re-render. Its cost is size: about 115 KB gzipped for a line chart, the second largest measured.

**Runner-up: Chart.js 4.6.1 with react-chartjs-2 5.3.1.** Half the size (about 58 KB gzipped) and very well maintained, but it draws on canvas. Canvas cannot read CSS variables, so dark mode needs JavaScript to resolve colours and redraw, and the chart is invisible to screen readers unless we write the accessible text ourselves [S9].

| Area | Recommendation |
| --- | --- |
| Library | `recharts` 3.10.1 in `apps/web`. Peers: react, react-dom and react-is `^19.0.0` among others [S1]. Add `react-is` at 19.3.0 to match React. |
| Server and client | A small `"use client"` chart component. The Server Component fetches Rounds, computes the rolling averages in `packages/domain`, and passes plain arrays as props. |
| Layout | Four small charts, one per SG Category, each with two lines (5-Round and 20-Round average). Link their tooltips with `syncId`. **Inference:** eight lines on one chart would be hard to read. |
| Zero line | `<ReferenceLine y={0} />`. |
| Two decimals | `tickFormatter` on `YAxis` and `formatter` on `Tooltip`, both using the shared two-decimal formatter in `packages/domain`. |
| Theming | Define `--chart-1` and `--chart-2` (plus grid and text colours) in `apps/web` CSS under `:root` and `.dark`, and pass `var(--…)` through Recharts' theme object or props [S4]. HeroUI 3.2.7 has no chart tokens to reuse [S10]. |
| Accessibility | Keep the default `accessibilityLayer` (on by default in 3.x) [S5], give each chart a title, and show the latest values as text beside it. |

### Versions checked

From the npm registry on 2026-11-10 [S1] and the installed packages [S10].

| Package | Latest | Last stable release | React peer | Notes |
| --- | --- | --- | --- | --- |
| recharts | 3.10.1 | 2026-07-25 | `^16.8 \|\| … \|\| ^19.0.0` | Canary 3.11.0-canary.9 on 2026-11-03 [S2] |
| @visx/xychart | 4.0.0 | 2026-06-11 | `^18.0.0 \|\| ^19.0.0` | Previous release 3.12.0 was 2024-11 [S2] |
| @nivo/line | 0.99.0 | 2025-05-23 | `^16.14 \|\| … \|\| ^19.0` | No release in 18 months [S2] |
| @tremor/react | 3.18.7 | 2025-01-13 | **`^18.0.0` only** | Depends on recharts `^2.13.3` [S1] |
| chart.js / react-chartjs-2 | 4.6.1 / 5.3.1 | 2026-10-22 / 2025-10 | `… \|\| ^19.0.0` (wrapper) | |
| echarts / echarts-for-react | 6.1.0 / 3.0.6 | 2026-05-19 | `>=16.0.0` (wrapper) | |
| uplot / uplot-react | 1.6.32 / 1.2.4 | 2025-03-14 | `>=16.8.6` (wrapper) | |

## 1. Comparison

Sizes are esbuild output for a minimal multi-series line chart with axes, tooltip and legend, React externalised, minified, then gzip -9 [S10]. They are a relative guide, not a Next.js measurement.

| Library | Rendering | Gzipped | CSS-variable theming | Zero line | Accessibility | Maintenance |
| --- | --- | --- | --- | --- | --- | --- |
| **Recharts 3** | SVG | ~115 KB | Yes, documented [S4] | `ReferenceLine` | Keyboard and screen-reader layer, on by default [S5] | 27.7k stars, pushed 2026-11-09, frequent releases [S2] |
| visx 4 (xychart) | SVG | ~60 KB | Yes, any SVG prop | `Line` from `@visx/shape` or an annotation | Build it yourself | 21.1k stars, one release in two years [S2] |
| Nivo 0.99 | SVG or canvas | ~97 KB | Theme object, colours as values | `markers` | Some ARIA props | 14.1k stars, no release since 2025-05 [S2] |
| Tremor (npm) | SVG (Recharts 2) | n/a | Tailwind classes | No built-in | Inherits Recharts 2 | Last publish 2025-01, React 18 peer [S1][S2] |
| Tremor Raw (copy-paste) | SVG (Recharts 2) | as Recharts | Tailwind classes | Write it | Inherits Recharts | Source built on recharts `^2.15.2`, React 18 [S6][S7] |
| Chart.js 4 + react-chartjs-2 | Canvas | ~58 KB | No: resolve in JS, then update | Plugin or grid callback | Canvas hidden from screen readers; add ARIA yourself [S9] | 67.8k stars, released 2026-10-22 [S2] |
| ECharts 6 | Canvas or SVG | ~198 KB (SVG renderer, tree-shaken) | Theme objects; registered in JS | `markLine` | `aria` option auto-generates a description and decal patterns [S8] | 67.7k stars, 1,476 open issues [S2] |
| uPlot | Canvas | ~25 KB | No: JS options | Custom hook | None built in | 10.6k stars, last release 2025-03 [S2] |

**None of them ship `"use client"`.** I checked the published entry files of recharts, react-chartjs-2, echarts-for-react, @visx/xychart, @nivo and uplot-react [S10]. All rely on hooks, context or the DOM, so in the App Router each must be imported from our own `"use client"` component. That is a few lines and the same for every candidate, so it does not separate them. Tremor Raw's components start with `"use client"` [S7].

### Why Recharts

- **Theme follows HeroUI with no JavaScript.** HeroUI 3.2.7 switches themes with the `.dark` class or `data-theme="dark"` [S10]. Recharts passes theme values to the DOM unchanged, so `var(--chart-1)` works, and the docs say switching then "happens in CSS, with no React re-render and no flash on server-rendered pages" [S4]. The theme API (`RechartsThemeProvider`, `lightTheme`, `darkTheme`) is in the 3.10.1 types [S10]. Plain `stroke="var(--chart-1)"` on each `Line` works too.
- **Every part we need is a component.** `LineChart`, two `Line`s, `XAxis`, `YAxis`, `ReferenceLine y={0}`, `Tooltip`, `Legend`. Negative values need nothing special. `syncId` lines up tooltips across the four SG Category charts.
- **Accessibility is on by default.** `accessibilityLayer` is documented as "Turn on accessibility support for keyboard-only and screen reader users" with `@defaultValue true` [S10].
- **Maintenance.** The most active SVG option: stable releases roughly monthly through 2026, canaries into November [S2].

### Why not the others

- **Chart.js (runner-up).** Smaller and dependable, and the right pick if bundle size dominates. But dark mode means reading CSS variables with `getComputedStyle` and updating the chart when the theme changes, and accessibility is entirely our job [S9]. **Inference:** for four small charts, SVG theming in CSS is worth the extra ~57 KB.
- **visx.** Smallest SVG option and very flexible, but it is a set of primitives. Tooltip, legend and accessibility are ours to assemble. Releases are rare: 4.0.0 in June 2026 after 19 months without one [S2].
- **Nivo.** Good defaults, but no release since May 2025 [S2], and its theme is a JavaScript object rather than CSS.
- **Tremor.** The npm package's React peer is `^18.0.0` only and it pins Recharts 2 [S1]. The copy-paste version is also on Recharts 2 and React 18 [S6]. **Inference:** adopting it means porting its components to Recharts 3 anyway, at which point use Recharts directly. Its Tailwind-class colour approach is still a good pattern to borrow.
- **ECharts.** Strongest built-in accessibility description [S8], but the largest bundle by far for one line chart, and an option-object API rather than React components.
- **uPlot.** Tiny and fast for huge time series, which this is not. Canvas, no accessibility, and a 2025 last release [S2].

### Illustrative component

```tsx
// apps/web/app/trends/sg-trend-chart.tsx (illustrative, not run)
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Legend, CartesianGrid } from 'recharts';
import { formatStrokesGained } from '@golf/domain';

type Point = { date: string; avg5: number | null; avg20: number | null };

export function SgTrendChart({ title, data }: { title: string; data: Point[] }) {
  return (
    <LineChart data={data} syncId="sg-trends" responsive style={{ width: '100%', aspectRatio: 2 }} title={title}>
      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
      <XAxis dataKey="date" />
      <YAxis tickFormatter={formatStrokesGained} />
      <ReferenceLine y={0} stroke="var(--chart-zero)" />
      <Tooltip formatter={(v) => formatStrokesGained(Number(v))} />
      <Legend />
      <Line dataKey="avg5" name="5 Rounds" stroke="var(--chart-1)" dot={false} connectNulls />
      <Line dataKey="avg20" name="20 Rounds" stroke="var(--chart-2)" dot={false} connectNulls />
    </LineChart>
  );
}
```

```css
/* apps/web/app/globals.css, after the HeroUI imports */
:root { --chart-1: oklch(55% 0.2 255); --chart-2: oklch(65% 0.05 255); --chart-grid: var(--border); --chart-zero: var(--muted); }
.dark, [data-theme="dark"] { --chart-1: oklch(75% 0.15 255); --chart-2: oklch(60% 0.04 255); }
```

`responsive` is a 3.x chart prop that sizes with CSS instead of `ResponsiveContainer` [S10]. The 20-Round average is `null` until 20 Rounds exist, so the second line starts later. Colours are placeholders.

**What would change this:**

- Bundle size becomes a measured problem on the trends page: switch to Chart.js and accept JavaScript theme handling and manual accessibility.
- HeroUI ships open-source charts: re-evaluate. HeroUI Pro's paid charts were not evaluated.
- Recharts stops accepting the React version we move to: check its peer range on each React upgrade.

## Not verified

- **No build or render.** Nothing ran in Next.js 16.4.5, under Turbopack, or with server rendering. Recharts' SSR output with `responsive` was not checked.
- **Bundle sizes** are esbuild with React externalised, not Next.js's production output, and include each library's dependencies (Recharts brings Redux Toolkit, Immer and Reselect [S1]).
- **Recharts accessibility** was read from the type documentation, not tested with a screen reader. Its docs site has no accessibility guide page [S3].
- **Tremor's status** after its announced move to Vercel [S6] is unclear. Neither its site nor the npm repository README says whether `@tremor/react` is maintained [S6][S11].
- **Rolling-average maths** belongs in `packages/domain` and was not designed here.
- **Mobile charts** are out of scope.

## Sources

Registry and repository data retrieved 2026-11-10.

| # | Source | Applies to |
| --- | --- | --- |
| S1 | [npm registry](https://www.npmjs.com/), `npm view` for each package (version, peers, dependencies, publish times) | 2026-11-10 |
| S2 | GitHub API: repository stats and releases for [recharts](https://github.com/recharts/recharts), [visx](https://github.com/airbnb/visx), [nivo](https://github.com/plouc/nivo), [tremor-npm](https://github.com/tremorlabs/tremor-npm), [tremor](https://github.com/tremorlabs/tremor), [Chart.js](https://github.com/chartjs/Chart.js), [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2), [echarts](https://github.com/apache/echarts), [echarts-for-react](https://github.com/hustcc/echarts-for-react), [uPlot](https://github.com/leeoniya/uPlot) | 2026-11-10 |
| S3 | [Recharts guide index](https://recharts.github.io/en-US/guide/) | Current docs |
| S4 | [Recharts theming guide](https://recharts.github.io/en-US/guide/theming/) | Current docs |
| S5 | [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) and 3.10.1 type declarations | 3.x |
| S6 | [Tremor site](https://www.tremor.so/), [tremor package.json](https://github.com/tremorlabs/tremor/blob/main/package.json) | 2026-11-10 |
| S7 | [Tremor LineChart source](https://github.com/tremorlabs/tremor/blob/main/src/components/LineChart/LineChart.tsx) | main branch |
| S8 | [ECharts handbook: accessibility](https://echarts.apache.org/handbook/en/best-practices/aria/) | Current docs |
| S9 | [Chart.js accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html) | 4.x docs |
| S10 | Throwaway npm project: installed source and types of recharts 3.10.1, @visx/xychart 4.0.0, @nivo/line 0.99.0, chart.js 4.6.1, react-chartjs-2 5.3.1, echarts 6.1.0, echarts-for-react 3.0.6, uplot 1.6.32, uplot-react 1.2.4, @heroui/styles 3.2.7; esbuild bundles of a minimal line chart | 2026-11-10 |
| S11 | [tremor-npm README](https://github.com/tremorlabs/tremor-npm) | 2026-11-10 |
