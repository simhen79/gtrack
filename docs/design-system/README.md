# gtrack

gtrack is a golf practice app. Golfers log Rounds with Strokes Gained, see where they lose strokes, and run Practice Sessions of Drills and Games at the range. This system is its look: a dark charcoal dashboard with flat rounded cards, a row of nav pills along the top, warm orange for actions, lime for selection and big bold numbers. One set of tokens feeds both **HeroUI v3** on the web (`@heroui/react`, Tailwind CSS v4) and **HeroUI Native** on the phone (`heroui-native`, Uniwind).

Start here, then read the sections in order: **Setup: web**, **Setup: phone**, **HeroUI component map** (every HeroUI component and how gtrack uses it). Components then shows each HeroUI family themed, plus **gtrack patterns**: SGValue, SGCategory, SGInput, LevelMeter, ConnectionChip, WeekStrip, TrendChart and LiveScore, gtrack's own pieces built from HeroUI parts.

Ready-to-use files are in `code/`: `gtrack-theme.css` (web), `global.css`, `metro.config.js` and `_layout.tsx` (phone), and `sg.ts` (shared Strokes Gained helpers). Both CSS files are generated from `tokens.json`.

## Principles

1. **Numbers first.** A Strokes Gained number, a score or a clock is the biggest thing on its card. Labels sit small and muted beside it.
2. **One action, one orange.** Each view has at most one `accent` button. Everything selected but not an action (today's day, Level up, the active sub-nav) is `highlight` lime. The current page in the top nav is a white `segment` pill.
3. **Flat, tonal depth.** No borders or shadows on cards. Depth is three steps of grey: `background` → `surface` → `surface-secondary` → `surface-tertiary`. Shadows appear only on overlays.
4. **Square-ish controls, round cards.** Controls use 12px corners (`radius-control`, HeroUI `--field-radius`), cards 24px, tiles inside cards 18px, badges 6px. Full circles only for avatars, status dots and Level pips.
5. **The sun decides the live screen.** The live Practice Session uses the **Range** theme: pure black, white, one lime action, and targets of 64px or more.
6. **Signs carry meaning; colour only backs it up.** Strokes Gained always shows a sign and two decimals. SG Categories always show their three-letter code.

## Themes

| Theme id | When | Notes |
| --- | --- | --- |
| `dark` (default) | Web and phone, all screens outside a live session | The designed look. |
| `light` | When the system setting is light | Sage ground `#E4E8D8`, off-white cards. Same structure, darker accents for 4.5:1. |
| `range` | Phone, live Practice Session only | Black ground, lime `accent`, orange `highlight`. Not the phone's dark mode: it is switched on when a session starts and off when it ends. |

On the web set `data-theme` on `<html>` (`dark`, `light`, `range`). On the phone call `Uniwind.setTheme('dark' | 'light' | 'range')`.

## Colour

- `accent` is the primary button and nothing else. Text on it is `accent-foreground` (dark on orange).
- `highlight` marks selection: today in the Weekly Plan strip, a Level that went up, the active admin sub-nav pill, filled Level pips.
- `segment` / `segment-foreground` is the selected pill in Tabs and ToggleButtonGroup: white with dark text in dark mode.
- Status: `success` (Online, saved), `warning` (Offline, rules changed, LLM cap reached), `danger` (delete, Abandon, errors).
- Strokes Gained: `sg-positive` mint, `sg-negative` coral, `sg-zero` muted.
- SG Categories, always in this order with their code: OTT `cat-ott` amber · APP `cat-app` orange · SHG `cat-shg` lime · PUT `cat-put` teal, text `cat-foreground`.
- Charts: resting bars and the Last 20 line `chart-bar`; the current bar or the Last 5 line in the category colour or `accent`; zero line `muted`; grid `separator` dashed.

Every text pair has at least 4.5:1 contrast in all three themes, including the 11px codes on category badges.

## Type

- **Manrope** (Google Fonts, 400–800) for everything, with tabular figures (`font-feature-settings: "tnum"`).
- **Instrument Serif** (Google Fonts, 400) for one hero title per page: `hero` 46px, or `hero-sm` 34px on phone. Never bold, never for numbers.
- Numbers use the `Numbers` styles: `stat-xl` 48, `stat` 32, `stat-sm` 16, all weight 800. Live: `live-score` 156, `live-clock` 112.
- Text: `title` 20/800, `card-title` 18/700, `body` 15/500, `label` 13/700, `small` 13/500 in `muted`, `caption` 11/800 for badge codes only.

## Words

Use the glossary terms exactly and capitalised in every label: Round, Strokes Gained (SG), SG Category, Baseline, Handicap Index, Course Handicap, Skill, Focus, Practice Ground, Facility, Practice Session, Session Item, Weekly Plan, Unplanned Session, Generation, Drill, Game, Level, Proficiency, Variation, Catalogue, Draft. Avoid the listed synonyms (scorecard, workout, ad-hoc session, tier, library, template…). Button labels are verbs plus the term: "Enter a Round", "Save Round", "Start Practice Session", "Publish v3".

### Strokes Gained format

`+1.05`, `0.00`, `−2.10`: always a sign (a true minus `−`, U+2212), always two decimals, tabular figures. Format in one shared helper on both platforms:

```ts
export const formatSG = (n: number) =>
  Math.abs(n) < 0.005 ? "0.00" : (n > 0 ? "+" : "−") + Math.abs(n).toFixed(2);
export const sgTone = (n: number) =>
  Math.abs(n) < 0.005 ? "text-sg-zero" : n > 0 ? "text-sg-positive" : "text-sg-negative";
```

## Layout

- **Web shell**: a top bar with the wordmark, the nav pills (Home, Rounds, Trends, Practice, Practice Grounds, plus Admin for admins), then search, Enter a Round and the avatar on the right. Admin pages add a second row of smaller sub-nav pills. Pages are a bento grid of cards with 16px gaps and 28px side padding. Cards flex-wrap so the grid stacks into one column at phone width, where the nav collapses into a menu button.
- **Phone app**: top row of menu button, wordmark and avatar; stacked cards with 14–16px page padding; the live session takes the whole screen in Range.

## Iconography

Line icons, 1.8–2px stroke, rounded caps and joins, 20px in nav and buttons, 14–16px in chips. Use `@gravity-ui/icons`, which HeroUI's own docs and examples use, on both web and phone. The four SG Category marks are simple outlines: ball on tee, flag, chip arc, ball by the cup. No emoji.

No logo exists yet. The wordmark is "gtrack" in Manrope 800 next to a ring-and-dot mark (`accent` ring, `highlight` dot).
