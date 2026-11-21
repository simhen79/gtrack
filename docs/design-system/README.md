# gtrack

gtrack is a golf practice app. Golfers log Rounds with Strokes Gained, see where they lose strokes, and run Practice Sessions of Drills and Games at the range. This system is its look: a dark charcoal dashboard with flat rounded cards, a sidebar for navigation (a tab bar on phones), warm orange for actions, lime for selection and big bold numbers. One set of tokens feeds both **HeroUI v3** on the web (`@heroui/react`, Tailwind CSS v4) and **HeroUI Native** on the phone (`heroui-native`, Uniwind).

Start here, then read the sections in order: **Setup: web**, **Setup: phone**, **HeroUI component map** (every HeroUI component and how gtrack uses it). Components then shows each HeroUI family themed, plus **gtrack patterns**: SGValue, SGCategory, SGInput, LevelMeter, ConnectionChip, WeekStrip, TrendChart and LiveScore, gtrack's own pieces built from HeroUI parts.

Ready-to-use files are in `code/`: `gtrack-theme.css` (web), `global.css`, `metro.config.js` and `_layout.tsx` (phone), and `sg.ts` (shared Strokes Gained helpers). Both CSS files are generated from `tokens.json`.

## Principles

1. **Numbers first.** A Strokes Gained number, a score or a clock is the biggest thing on its card. Labels sit small and muted beside it.
2. **One action, one orange.** Each view has at most one `accent` button. Everything selected but not an action (today's day, Level up, the current admin page) is `highlight` lime. The current page in the sidebar or tab bar is white `segment`.
3. **Flat, tonal depth.** No borders or shadows on cards. Depth is three steps of grey: `background` → `surface` → `surface-secondary` → `surface-tertiary`. Shadows appear only on overlays.
4. **Square-ish controls, round cards.** Controls use 12px corners (`radius-control`, HeroUI `--field-radius`), cards 24px, tiles inside cards 18px, badges 6px. Full circles only for avatars, status dots and Level pips.
5. **The sun decides the live screen.** The live Practice Session uses the **Range** theme: pure black, white, one lime action, and targets of 64px or more.
6. **Signs carry meaning; colour only backs it up.** Strokes Gained always shows a sign and two decimals. SG Categories always show their three-letter code.

## Themes

| Theme id | When | Notes |
| --- | --- | --- |
| `dark` | Web and phone outside a live session, when the golfer picks Dark, or System on a dark device | The designed look. |
| `light` | When the golfer picks Light, or System on a light device | Sage ground `#E4E8D8`, off-white cards. Same structure, darker accents for 4.5:1. |
| `range` | Phone, live Practice Session only | Black ground, lime `accent`, orange `highlight`. Not the phone's dark mode: it is switched on when a session starts and off when it ends, whatever the golfer's choice. |

Golfers choose **System**, **Dark** or **Light** in the avatar menu. System is the default, and the choice is remembered per device (browser storage on the web, device storage on the phone), not on the account.

On the web set `data-theme` on `<html>` (`dark`, `light`, `range`), resolving System with `prefers-color-scheme`. On the phone call `Uniwind.setTheme('system' | 'dark' | 'light' | 'range')`.

## Colour

- `accent` is the primary button and nothing else. Text on it is `accent-foreground` (dark on orange).
- `highlight` marks selection: today in the Weekly Plan strip, a Level that went up, the current admin page in the sidebar, filled Level pips.
- `segment` / `segment-foreground` is the current sidebar item and tab, and the selected pill in Tabs and ToggleButtonGroup: white with dark text in dark mode.
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

- **Web shell**: a sidebar on the left, 256px on `surface`. From the top: the wordmark, Enter a Round (the view's one `accent` button), then the nav, 44px rows with 20px icons: Home, Rounds, Trends, Practice, Practice Grounds. Admins get an Admin section under a small caps label with its pages (Users, Catalogue, Drafts) as 40px rows. The account sits at the bottom: avatar and email, with a menu for the theme choice and Sign out. The current page is `segment`; the current admin page is `highlight`.
- **Collapsed sidebar**: a 76px icon rail with the ring mark, a square `accent` **+**, icons only (names in a Tooltip) and the avatar. The golfer toggles it with the « / » button or `[`; the browser remembers it.
- **Pages**: each page starts with its title as an Instrument Serif `hero` heading, set by the shell, then a bento grid of cards with 16px gaps and 28px side padding.
- **Page actions**: a page's create action (Add a Drill, and every future "Add …" or "New …") sits at the **top right of the page, on the title's line**, never inside a card. On the web, pass it as `action` in the page's `layout` (`ShellProps` in `api/resources/js/layouts/app-shell.tsx`) and the shell places it: beside the title at desktop width, beside the avatar in the top row at phone width. It's a `secondary` button with a **+** icon, because Enter a Round is the view's one `accent` button.
- **Forms keep their save action in view**: a form page puts its one action (Save Drill, Save Round) and Cancel or Delete in a bar on `surface` between the page's tabs and the form, the same width and left edge as the form's cards. The bar sticks to the top of the content area as the form scrolls, at every width, so a golfer or admin never scrolls to find Save. A "wasn't saved" banner sits between the bar and the first card. Drill forms use the full width of the page; Round entry keeps its focused column, per [How should the web pages use a wide screen?](https://github.com/simhen79/gtrack/issues/50), with the live Total Strokes Gained at the right of its bar at desktop width and in the Strokes Gained heading below it narrower.
- **Web at phone width**: the sidebar gives way to a bottom tab bar on `surface`: Home, Rounds, a raised round `accent` **+** for Enter a Round, Trends, Practice. A top row holds the wordmark, the page name and the avatar, whose menu adds Practice Grounds and Admin. Cards stack into one column.
- **Phone app**: the same tab bar, built with Expo Router tabs, under a top row of wordmark and avatar; stacked cards with 14–16px page padding; the live session takes the whole screen in Range, without the tab bar.
- **Why this shape**: one nav model everywhere (a sidebar where there's room, tabs on phones) instead of pills that fold into a menu. Chosen by prototyping three shells against the real pages in [#51](https://github.com/simhen79/gtrack/issues/51); the variants live on the `prototype/51-app-shell` branch.

## Confirming

Every destructive or irreversible action (delete, retire, delete my account) asks first in the **same dialog**. On the web that's `ConfirmDialog` in `api/resources/js/components/confirm-dialog.tsx`: never `window.confirm`, and never a hand-built AlertDialog. The phone's Dialog follows the same layout and wording.

- **Heading**: "<Verb> this <thing>?", such as "Delete this Round?" or "Retire this Game?", with the `danger` icon on its right, on the same line.
- **Body**: names the thing in bold (`ConfirmName`), says what goes and what stays, and ends with whether it can be undone.
- **Buttons**: "Keep <thing>" (`tertiary`, closes) then the `danger` confirm, which repeats the trigger's words ("Delete Round"). The confirm shows progress while the request runs.
- **Trigger**: `danger-soft` beside other actions; `danger` when it's the only action on its card.

## Iconography

Line icons, 1.8–2px stroke, rounded caps and joins, 20px in nav and buttons, 14–16px in chips. Use `@gravity-ui/icons`, which HeroUI's own docs and examples use, on both web and phone. The four SG Category marks are simple outlines: ball on tee, flag, chip arc, ball by the cup. No emoji.

No logo exists yet. The wordmark is "gtrack" in Manrope 800 next to a ring-and-dot mark (`accent` ring, `highlight` dot).
